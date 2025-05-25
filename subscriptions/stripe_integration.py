import os
import stripe
from datetime import datetime, timedelta
from flask import current_app, url_for
from dotenv import load_dotenv

# Import models
from models import db, User
from subscriptions.models import SubscriptionPlan, Subscription, PaymentMethod, Invoice

# Load environment variables
load_dotenv()

# Initialize Stripe with API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
stripe_webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

# Default subscription plans
DEFAULT_PLANS = [
    {
        'name': 'free',
        'display_name': 'Free',
        'description': 'Basic features for language learning',
        'price': 0.00,
        'interval': 'month',
        'features': {
            'word_limit': 20,
            'ai_lessons': True,
            'advanced_grammar': False,
            'enhanced_vocabulary': False,
            'audio_generation': False,
            'offline_access': False
        }
    },
    {
        'name': 'premium',
        'display_name': 'Premium',
        'description': 'Full access to all features',
        'price': 9.99,
        'interval': 'month',
        'features': {
            'word_limit': -1,  # Unlimited
            'ai_lessons': True,
            'advanced_grammar': True,
            'enhanced_vocabulary': True,
            'audio_generation': True,
            'offline_access': True
        }
    },
    {
        'name': 'annual',
        'display_name': 'Annual',
        'description': 'Full access to all features with 20% discount',
        'price': 95.88,
        'interval': 'year',
        'features': {
            'word_limit': -1,  # Unlimited
            'ai_lessons': True,
            'advanced_grammar': True,
            'enhanced_vocabulary': True,
            'audio_generation': True,
            'offline_access': True,
            'priority_support': True
        }
    }
]

def initialize_subscription_plans():
    """Initialize subscription plans in the database"""
    for plan_data in DEFAULT_PLANS:
        # Check if plan already exists
        plan = SubscriptionPlan.query.filter_by(name=plan_data['name']).first()
        
        if not plan:
            # Create plan in database
            plan = SubscriptionPlan(
                name=plan_data['name'],
                display_name=plan_data['display_name'],
                description=plan_data['description'],
                price=plan_data['price'],
                interval=plan_data['interval'],
                features=plan_data['features']
            )
            
            # Create plan in Stripe (except for free plan)
            if plan.price > 0:
                try:
                    stripe_product = stripe.Product.create(
                        name=plan.display_name,
                        description=plan.description
                    )
                    
                    stripe_price = stripe.Price.create(
                        product=stripe_product.id,
                        unit_amount=int(plan.price * 100),  # Convert to cents
                        currency='usd',
                        recurring={
                            'interval': plan.interval
                        }
                    )
                    
                    plan.stripe_price_id = stripe_price.id
                except Exception as e:
                    current_app.logger.error(f"Error creating Stripe product/price: {e}")
            
            db.session.add(plan)
            
    db.session.commit()

def create_stripe_customer(user):
    """Create a Stripe customer for a user"""
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
            metadata={
                'user_id': user.id
            }
        )
        
        return customer.id
    except Exception as e:
        current_app.logger.error(f"Error creating Stripe customer: {e}")
        return None

def create_subscription(user, plan_id, payment_method_id=None):
    """Create a subscription for a user"""
    # Get the subscription plan
    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return {'success': False, 'message': 'Invalid subscription plan'}
    
    # Free plan doesn't need Stripe subscription
    if plan.name == 'free':
        # Check if user already has a subscription
        existing_subscription = Subscription.query.filter_by(user_id=user.id).first()
        
        if existing_subscription:
            # Update existing subscription
            existing_subscription.plan_id = plan.id
            existing_subscription.status = 'active'
            existing_subscription.current_period_start = datetime.utcnow()
            existing_subscription.current_period_end = datetime.utcnow() + timedelta(days=365*10)  # 10 years for free plan
            existing_subscription.cancel_at_period_end = False
            existing_subscription.canceled_at = None
        else:
            # Create new subscription
            subscription = Subscription(
                user_id=user.id,
                plan_id=plan.id,
                status='active',
                current_period_start=datetime.utcnow(),
                current_period_end=datetime.utcnow() + timedelta(days=365*10)  # 10 years for free plan
            )
            db.session.add(subscription)
        
        # Update user subscription tier
        user.subscription_tier = 'free'
        user.subscription_start = datetime.utcnow()
        user.subscription_end = datetime.utcnow() + timedelta(days=365*10)  # 10 years for free plan
        
        db.session.commit()
        return {'success': True, 'message': 'Free subscription activated'}
    
    # For paid plans, we need to create a Stripe subscription
    if not payment_method_id:
        return {'success': False, 'message': 'Payment method is required for paid plans'}
    
    try:
        # Ensure user has a Stripe customer ID
        if not user.stripe_customer_id:
            user.stripe_customer_id = create_stripe_customer(user)
            if not user.stripe_customer_id:
                return {'success': False, 'message': 'Failed to create Stripe customer'}
            db.session.commit()
        
        # Attach payment method to customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=user.stripe_customer_id
        )
        
        # Set as default payment method
        stripe.Customer.modify(
            user.stripe_customer_id,
            invoice_settings={
                'default_payment_method': payment_method_id
            }
        )
        
        # Store payment method in database
        payment_method = stripe.PaymentMethod.retrieve(payment_method_id)
        card = payment_method.card
        
        # Check if payment method already exists
        existing_payment_method = PaymentMethod.query.filter_by(
            user_id=user.id,
            stripe_payment_method_id=payment_method_id
        ).first()
        
        if not existing_payment_method:
            # Create new payment method
            db_payment_method = PaymentMethod(
                user_id=user.id,
                stripe_payment_method_id=payment_method_id,
                card_brand=card.brand,
                card_last4=card.last4,
                card_exp_month=card.exp_month,
                card_exp_year=card.exp_year,
                is_default=True
            )
            db.session.add(db_payment_method)
        
        # Create subscription in Stripe
        stripe_subscription = stripe.Subscription.create(
            customer=user.stripe_customer_id,
            items=[
                {'price': plan.stripe_price_id}
            ],
            payment_behavior='default_incomplete',
            expand=['latest_invoice.payment_intent'],
            metadata={
                'user_id': user.id
            }
        )
        
        # Check if user already has a subscription
        existing_subscription = Subscription.query.filter_by(user_id=user.id).first()
        
        if existing_subscription:
            # Update existing subscription
            existing_subscription.plan_id = plan.id
            existing_subscription.stripe_subscription_id = stripe_subscription.id
            existing_subscription.status = stripe_subscription.status
            existing_subscription.current_period_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
            existing_subscription.current_period_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
            existing_subscription.cancel_at_period_end = stripe_subscription.cancel_at_period_end
            existing_subscription.canceled_at = datetime.fromtimestamp(stripe_subscription.canceled_at) if stripe_subscription.canceled_at else None
        else:
            # Create new subscription
            subscription = Subscription(
                user_id=user.id,
                plan_id=plan.id,
                stripe_subscription_id=stripe_subscription.id,
                stripe_customer_id=user.stripe_customer_id,
                status=stripe_subscription.status,
                current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end),
                cancel_at_period_end=stripe_subscription.cancel_at_period_end,
                canceled_at=datetime.fromtimestamp(stripe_subscription.canceled_at) if stripe_subscription.canceled_at else None
            )
            db.session.add(subscription)
        
        # Update user subscription tier
        user.subscription_tier = plan.name
        user.subscription_start = datetime.fromtimestamp(stripe_subscription.current_period_start)
        user.subscription_end = datetime.fromtimestamp(stripe_subscription.current_period_end)
        
        db.session.commit()
        
        # Return client secret for payment confirmation
        client_secret = stripe_subscription.latest_invoice.payment_intent.client_secret
        return {
            'success': True,
            'client_secret': client_secret,
            'subscription_id': stripe_subscription.id
        }
    except Exception as e:
        current_app.logger.error(f"Error creating subscription: {e}")
        return {'success': False, 'message': str(e)}

def cancel_subscription(user):
    """Cancel a user's subscription"""
    # Get user's subscription
    subscription = Subscription.query.filter_by(user_id=user.id).first()
    
    if not subscription:
        return {'success': False, 'message': 'No active subscription found'}
    
    # For free plan, just update the status
    if subscription.plan.name == 'free':
        return {'success': False, 'message': 'Free plan cannot be canceled'}
    
    try:
        # Cancel subscription in Stripe
        stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        # Update subscription in database
        subscription.cancel_at_period_end = True
        db.session.commit()
        
        return {'success': True, 'message': 'Subscription will be canceled at the end of the billing period'}
    except Exception as e:
        current_app.logger.error(f"Error canceling subscription: {e}")
        return {'success': False, 'message': str(e)}

def handle_webhook_event(payload, signature):
    """Handle Stripe webhook events"""
    try:
        event = stripe.Webhook.construct_event(
            payload, signature, stripe_webhook_secret
        )
    except ValueError as e:
        # Invalid payload
        current_app.logger.error(f"Invalid payload: {e}")
        return {'success': False, 'message': 'Invalid payload'}
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        current_app.logger.error(f"Invalid signature: {e}")
        return {'success': False, 'message': 'Invalid signature'}
    
    # Handle the event
    if event.type == 'customer.subscription.created':
        handle_subscription_created(event.data.object)
    elif event.type == 'customer.subscription.updated':
        handle_subscription_updated(event.data.object)
    elif event.type == 'customer.subscription.deleted':
        handle_subscription_deleted(event.data.object)
    elif event.type == 'invoice.paid':
        handle_invoice_paid(event.data.object)
    elif event.type == 'invoice.payment_failed':
        handle_invoice_payment_failed(event.data.object)
    
    return {'success': True, 'message': 'Webhook processed'}

def handle_subscription_created(subscription_data):
    """Handle subscription created event"""
    # Get user from metadata
    user_id = subscription_data.metadata.get('user_id')
    if not user_id:
        current_app.logger.error("No user_id in subscription metadata")
        return
    
    user = User.query.get(user_id)
    if not user:
        current_app.logger.error(f"User not found: {user_id}")
        return
    
    # Get subscription plan from Stripe price ID
    stripe_price_id = subscription_data.items.data[0].price.id
    plan = SubscriptionPlan.query.filter_by(stripe_price_id=stripe_price_id).first()
    
    if not plan:
        current_app.logger.error(f"Plan not found for price ID: {stripe_price_id}")
        return
    
    # Update user's subscription
    subscription = Subscription.query.filter_by(stripe_subscription_id=subscription_data.id).first()
    
    if subscription:
        # Update existing subscription
        subscription.status = subscription_data.status
        subscription.current_period_start = datetime.fromtimestamp(subscription_data.current_period_start)
        subscription.current_period_end = datetime.fromtimestamp(subscription_data.current_period_end)
        subscription.cancel_at_period_end = subscription_data.cancel_at_period_end
        subscription.canceled_at = datetime.fromtimestamp(subscription_data.canceled_at) if subscription_data.canceled_at else None
    else:
        # Create new subscription
        subscription = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            stripe_subscription_id=subscription_data.id,
            stripe_customer_id=subscription_data.customer,
            status=subscription_data.status,
            current_period_start=datetime.fromtimestamp(subscription_data.current_period_start),
            current_period_end=datetime.fromtimestamp(subscription_data.current_period_end),
            cancel_at_period_end=subscription_data.cancel_at_period_end,
            canceled_at=datetime.fromtimestamp(subscription_data.canceled_at) if subscription_data.canceled_at else None
        )
        db.session.add(subscription)
    
    # Update user subscription tier
    user.subscription_tier = plan.name
    user.subscription_start = datetime.fromtimestamp(subscription_data.current_period_start)
    user.subscription_end = datetime.fromtimestamp(subscription_data.current_period_end)
    
    db.session.commit()

def handle_subscription_updated(subscription_data):
    """Handle subscription updated event"""
    # Get subscription from database
    subscription = Subscription.query.filter_by(stripe_subscription_id=subscription_data.id).first()
    
    if not subscription:
        current_app.logger.error(f"Subscription not found: {subscription_data.id}")
        return
    
    # Update subscription
    subscription.status = subscription_data.status
    subscription.current_period_start = datetime.fromtimestamp(subscription_data.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(subscription_data.current_period_end)
    subscription.cancel_at_period_end = subscription_data.cancel_at_period_end
    subscription.canceled_at = datetime.fromtimestamp(subscription_data.canceled_at) if subscription_data.canceled_at else None
    
    # Update user subscription end date
    user = User.query.get(subscription.user_id)
    if user:
        user.subscription_end = datetime.fromtimestamp(subscription_data.current_period_end)
    
    db.session.commit()

def handle_subscription_deleted(subscription_data):
    """Handle subscription deleted event"""
    # Get subscription from database
    subscription = Subscription.query.filter_by(stripe_subscription_id=subscription_data.id).first()
    
    if not subscription:
        current_app.logger.error(f"Subscription not found: {subscription_data.id}")
        return
    
    # Update subscription
    subscription.status = 'canceled'
    subscription.canceled_at = datetime.utcnow()
    
    # Update user subscription tier to free
    user = User.query.get(subscription.user_id)
    if user:
        user.subscription_tier = 'free'
        user.subscription_end = datetime.utcnow()
    
    db.session.commit()

def handle_invoice_paid(invoice_data):
    """Handle invoice paid event"""
    # Get subscription from invoice
    subscription_id = invoice_data.subscription
    if not subscription_id:
        return
    
    subscription = Subscription.query.filter_by(stripe_subscription_id=subscription_id).first()
    if not subscription:
        current_app.logger.error(f"Subscription not found: {subscription_id}")
        return
    
    # Create invoice record
    invoice = Invoice(
        user_id=subscription.user_id,
        subscription_id=subscription.id,
        stripe_invoice_id=invoice_data.id,
        amount=invoice_data.amount_paid / 100,  # Convert from cents
        currency=invoice_data.currency,
        status=invoice_data.status,
        invoice_pdf=invoice_data.invoice_pdf,
        invoice_date=datetime.fromtimestamp(invoice_data.created)
    )
    
    db.session.add(invoice)
    db.session.commit()

def handle_invoice_payment_failed(invoice_data):
    """Handle invoice payment failed event"""
    # Get subscription from invoice
    subscription_id = invoice_data.subscription
    if not subscription_id:
        return
    
    subscription = Subscription.query.filter_by(stripe_subscription_id=subscription_id).first()
    if not subscription:
        current_app.logger.error(f"Subscription not found: {subscription_id}")
        return
    
    # Update subscription status
    subscription.status = 'past_due'
    db.session.commit()
    
    # TODO: Send email notification to user about failed payment
