from flask import Blueprint

from subscriptions.routes import subscription_bp

def init_app(app):
    """Initialize subscription module with Flask app"""
    # Register blueprint
    app.register_blueprint(subscription_bp)
    
    # Initialize database models
    with app.app_context():
        from subscriptions.models import SubscriptionPlan, Subscription, PaymentMethod, Invoice
        from subscriptions.stripe_integration import initialize_subscription_plans
        
        # Initialize subscription plans if they don't exist
        try:
            initialize_subscription_plans()
        except Exception as e:
            app.logger.error(f"Error initializing subscription plans: {e}")
