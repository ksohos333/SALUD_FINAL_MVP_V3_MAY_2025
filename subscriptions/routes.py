from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, current_app
from flask_login import login_required, current_user
import stripe
import json
import os
from dotenv import load_dotenv

# Import models and Stripe integration
from models import db, User
from subscriptions.models import SubscriptionPlan, Subscription, PaymentMethod, Invoice
from subscriptions.stripe_integration import (
    initialize_subscription_plans, 
    create_subscription, 
    cancel_subscription, 
    handle_webhook_event
)

# Load environment variables
load_dotenv()

# Initialize Blueprint
subscription_bp = Blueprint('subscription', __name__, url_prefix='/subscription')

# Initialize Stripe public key
stripe_public_key = os.getenv('STRIPE_PUBLIC_KEY')

# Routes
@subscription_bp.route('/plans')
def plans():
    """Display subscription plans"""
    # Get all active plans
    plans = SubscriptionPlan.query.filter_by(is_active=True).all()
    
    # Check if user is authenticated
    if current_user.is_authenticated:
        # Get user's current subscription
        subscription = Subscription.query.filter_by(user_id=current_user.id).first()
        current_plan = subscription.plan if subscription else None
    else:
        current_plan = None
    
    return render_template(
        'subscription/plans.html',
        plans=plans,
        current_plan=current_plan,
        stripe_public_key=stripe_public_key
    )

@subscription_bp.route('/checkout/<int:plan_id>')
@login_required
def checkout(plan_id):
    """Checkout page for subscription"""
    # Get the plan
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    
    # If plan is free, activate it directly
    if plan.name == 'free':
        result = create_subscription(current_user, plan.id)
        if result['success']:
            flash('Free plan activated successfully', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash(f'Error activating free plan: {result["message"]}', 'danger')
            return redirect(url_for('subscription.plans'))
    
    # Get user's payment methods
    payment_methods = PaymentMethod.query.filter_by(user_id=current_user.id).all()
    
    return render_template(
        'subscription/checkout.html',
        plan=plan,
        payment_methods=payment_methods,
        stripe_public_key=stripe_public_key
    )

@subscription_bp.route('/create', methods=['POST'])
@login_required
def create():
    """Create a subscription"""
    data = request.json
    plan_id = data.get('plan_id')
    payment_method_id = data.get('payment_method_id')
    
    if not plan_id:
        return jsonify({'success': False, 'message': 'Plan ID is required'})
    
    # Create subscription
    result = create_subscription(current_user, plan_id, payment_method_id)
    
    return jsonify(result)

@subscription_bp.route('/cancel', methods=['POST'])
@login_required
def cancel():
    """Cancel a subscription"""
    # Cancel subscription
    result = cancel_subscription(current_user)
    
    if request.is_json:
        return jsonify(result)
    
    if result['success']:
        flash(result['message'], 'success')
    else:
        flash(result['message'], 'danger')
    
    return redirect(url_for('subscription.plans'))

@subscription_bp.route('/payment-methods')
@login_required
def payment_methods():
    """Display user's payment methods"""
    # Get user's payment methods
    payment_methods = PaymentMethod.query.filter_by(user_id=current_user.id).all()
    
    return render_template(
        'subscription/payment_methods.html',
        payment_methods=payment_methods,
        stripe_public_key=stripe_public_key
    )

@subscription_bp.route('/add-payment-method', methods=['POST'])
@login_required
def add_payment_method():
    """Add a payment method"""
    data = request.json
    payment_method_id = data.get('payment_method_id')
    
    if not payment_method_id:
        return jsonify({'success': False, 'message': 'Payment method ID is required'})
    
    try:
        # Ensure user has a Stripe customer ID
        if not current_user.stripe_customer_id:
            from subscriptions.stripe_integration import create_stripe_customer
            current_user.stripe_customer_id = create_stripe_customer(current_user)
            if not current_user.stripe_customer_id:
                return jsonify({'success': False, 'message': 'Failed to create Stripe customer'})
            db.session.commit()
        
        # Attach payment method to customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=current_user.stripe_customer_id
        )
        
        # Retrieve payment method details
        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
        card = payment_method.card
        
        # Create payment method in database
        db_payment_method = PaymentMethod(
            user_id=current_user.id,
            stripe_payment_method_id=payment_method_id,
            card_brand=card.brand,
            card_last4=card.last4,
            card_exp_month=card.exp_month,
            card_exp_year=card.exp_year,
            is_default=False
        )
        
        db.session.add(db_payment_method)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Payment method added successfully'})
    except Exception as e:
        current_app.logger.error(f"Error adding payment method: {e}")
        return jsonify({'success': False, 'message': str(e)})

@subscription_bp.route('/remove-payment-method/<int:payment_method_id>', methods=['POST'])
@login_required
def remove_payment_method(payment_method_id):
    """Remove a payment method"""
    # Get payment method
    payment_method = PaymentMethod.query.filter_by(id=payment_method_id, user_id=current_user.id).first()
    
    if not payment_method:
        if request.is_json:
            return jsonify({'success': False, 'message': 'Payment method not found'})
        flash('Payment method not found', 'danger')
        return redirect(url_for('subscription.payment_methods'))
    
    try:
        # Detach payment method from Stripe
        stripe.PaymentMethod.detach(payment_method.stripe_payment_method_id)
        
        # Delete payment method from database
        db.session.delete(payment_method)
        db.session.commit()
        
        if request.is_json:
            return jsonify({'success': True, 'message': 'Payment method removed successfully'})
        
        flash('Payment method removed successfully', 'success')
        return redirect(url_for('subscription.payment_methods'))
    except Exception as e:
        current_app.logger.error(f"Error removing payment method: {e}")
        if request.is_json:
            return jsonify({'success': False, 'message': str(e)})
        
        flash(f'Error removing payment method: {str(e)}', 'danger')
        return redirect(url_for('subscription.payment_methods'))

@subscription_bp.route('/set-default-payment-method/<int:payment_method_id>', methods=['POST'])
@login_required
def set_default_payment_method(payment_method_id):
    """Set a payment method as default"""
    # Get payment method
    payment_method = PaymentMethod.query.filter_by(id=payment_method_id, user_id=current_user.id).first()
    
    if not payment_method:
        if request.is_json:
            return jsonify({'success': False, 'message': 'Payment method not found'})
        flash('Payment method not found', 'danger')
        return redirect(url_for('subscription.payment_methods'))
    
    try:
        # Set as default payment method in Stripe
        stripe.Customer.modify(
            current_user.stripe_customer_id,
            invoice_settings={
                'default_payment_method': payment_method.stripe_payment_method_id
            }
        )
        
        # Update all payment methods to not be default
        PaymentMethod.query.filter_by(user_id=current_user.id).update({'is_default': False})
        
        # Set this payment method as default
        payment_method.is_default = True
        db.session.commit()
        
        if request.is_json:
            return jsonify({'success': True, 'message': 'Default payment method updated successfully'})
        
        flash('Default payment method updated successfully', 'success')
        return redirect(url_for('subscription.payment_methods'))
    except Exception as e:
        current_app.logger.error(f"Error setting default payment method: {e}")
        if request.is_json:
            return jsonify({'success': False, 'message': str(e)})
        
        flash(f'Error setting default payment method: {str(e)}', 'danger')
        return redirect(url_for('subscription.payment_methods'))

@subscription_bp.route('/invoices')
@login_required
def invoices():
    """Display user's invoices"""
    # Get user's invoices
    invoices = Invoice.query.filter_by(user_id=current_user.id).order_by(Invoice.invoice_date.desc()).all()
    
    return render_template(
        'subscription/invoices.html',
        invoices=invoices
    )

@subscription_bp.route('/webhook', methods=['POST'])
def webhook():
    """Stripe webhook endpoint"""
    payload = request.data
    signature = request.headers.get('Stripe-Signature')
    
    result = handle_webhook_event(payload, signature)
    
    if result['success']:
        return '', 200
    else:
        return jsonify({'error': result['message']}), 400

# Admin routes
@subscription_bp.route('/admin/plans')
@login_required
def admin_plans():
    """Admin page for managing subscription plans"""
    # Check if user is admin
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('dashboard'))
    
    # Get all plans
    plans = SubscriptionPlan.query.all()
    
    return render_template(
        'subscription/admin/plans.html',
        plans=plans
    )

@subscription_bp.route('/admin/plans/create', methods=['GET', 'POST'])
@login_required
def admin_create_plan():
    """Admin page for creating a subscription plan"""
    # Check if user is admin
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        # Create plan
        name = request.form.get('name')
        display_name = request.form.get('display_name')
        description = request.form.get('description')
        price = float(request.form.get('price'))
        interval = request.form.get('interval')
        features = json.loads(request.form.get('features', '{}'))
        
        # Check if plan already exists
        existing_plan = SubscriptionPlan.query.filter_by(name=name).first()
        if existing_plan:
            flash('A plan with this name already exists', 'danger')
            return redirect(url_for('subscription.admin_plans'))
        
        # Create plan in database
        plan = SubscriptionPlan(
            name=name,
            display_name=display_name,
            description=description,
            price=price,
            interval=interval,
            features=features
        )
        
        # Create plan in Stripe (except for free plan)
        if price > 0:
            try:
                stripe_product = stripe.Product.create(
                    name=display_name,
                    description=description
                )
                
                stripe_price = stripe.Price.create(
                    product=stripe_product.id,
                    unit_amount=int(price * 100),  # Convert to cents
                    currency='usd',
                    recurring={
                        'interval': interval
                    }
                )
                
                plan.stripe_price_id = stripe_price.id
            except Exception as e:
                current_app.logger.error(f"Error creating Stripe product/price: {e}")
                flash(f'Error creating Stripe product/price: {str(e)}', 'danger')
                return redirect(url_for('subscription.admin_plans'))
        
        db.session.add(plan)
        db.session.commit()
        
        flash('Plan created successfully', 'success')
        return redirect(url_for('subscription.admin_plans'))
    
    return render_template(
        'subscription/admin/create_plan.html'
    )

@subscription_bp.route('/admin/plans/edit/<int:plan_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_plan(plan_id):
    """Admin page for editing a subscription plan"""
    # Check if user is admin
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('dashboard'))
    
    # Get plan
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    
    if request.method == 'POST':
        # Update plan
        plan.display_name = request.form.get('display_name')
        plan.description = request.form.get('description')
        plan.is_active = request.form.get('is_active') == 'on'
        plan.features = json.loads(request.form.get('features', '{}'))
        
        # Update price and interval only for free plan (paid plans need to be updated in Stripe)
        if plan.name == 'free':
            plan.price = float(request.form.get('price'))
            plan.interval = request.form.get('interval')
        
        db.session.commit()
        
        flash('Plan updated successfully', 'success')
        return redirect(url_for('subscription.admin_plans'))
    
    return render_template(
        'subscription/admin/edit_plan.html',
        plan=plan
    )

@subscription_bp.route('/admin/subscriptions')
@login_required
def admin_subscriptions():
    """Admin page for managing subscriptions"""
    # Check if user is admin
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('dashboard'))
    
    # Get all subscriptions
    subscriptions = Subscription.query.all()
    
    return render_template(
        'subscription/admin/subscriptions.html',
        subscriptions=subscriptions
    )

@subscription_bp.route('/admin/initialize-plans', methods=['POST'])
@login_required
def admin_initialize_plans():
    """Initialize subscription plans"""
    # Check if user is admin
    if not current_user.is_admin:
        flash('You do not have permission to access this page', 'danger')
        return redirect(url_for('dashboard'))
    
    # Initialize plans
    initialize_subscription_plans()
    
    flash('Subscription plans initialized successfully', 'success')
    return redirect(url_for('subscription.admin_plans'))
