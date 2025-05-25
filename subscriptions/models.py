from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.mutable import MutableDict
import datetime
import json

from models import db, User

class SubscriptionPlan(db.Model):
    """Model for subscription plans"""
    __tablename__ = 'subscription_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # 'free', 'premium', 'annual'
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)  # Price in USD
    interval = db.Column(db.String(20), nullable=False)  # 'month', 'year'
    stripe_price_id = db.Column(db.String(100), nullable=True)  # Stripe Price ID
    features = db.Column(MutableDict.as_mutable(db.JSON), default=dict)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    subscriptions = db.relationship('Subscription', backref='plan', lazy=True)
    
    def to_dict(self):
        """Convert subscription plan to dictionary for API responses"""
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'price': self.price,
            'interval': self.interval,
            'features': self.features,
            'is_active': self.is_active
        }

class Subscription(db.Model):
    """Model for user subscriptions"""
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)
    stripe_subscription_id = db.Column(db.String(100), nullable=True)
    stripe_customer_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='active')  # 'active', 'canceled', 'past_due', 'trialing'
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    canceled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('subscription', uselist=False))
    
    def is_active(self):
        """Check if subscription is active"""
        return self.status == 'active' and self.current_period_end > datetime.datetime.utcnow()
    
    def to_dict(self):
        """Convert subscription to dictionary for API responses"""
        return {
            'id': self.id,
            'plan': self.plan.to_dict() if self.plan else None,
            'status': self.status,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancel_at_period_end': self.cancel_at_period_end,
            'canceled_at': self.canceled_at.isoformat() if self.canceled_at else None,
            'is_active': self.is_active()
        }

class PaymentMethod(db.Model):
    """Model for user payment methods"""
    __tablename__ = 'payment_methods'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stripe_payment_method_id = db.Column(db.String(100), nullable=False)
    card_brand = db.Column(db.String(50), nullable=True)  # 'visa', 'mastercard', etc.
    card_last4 = db.Column(db.String(4), nullable=True)
    card_exp_month = db.Column(db.Integer, nullable=True)
    card_exp_year = db.Column(db.Integer, nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='payment_methods')
    
    def to_dict(self):
        """Convert payment method to dictionary for API responses"""
        return {
            'id': self.id,
            'card_brand': self.card_brand,
            'card_last4': self.card_last4,
            'card_exp_month': self.card_exp_month,
            'card_exp_year': self.card_exp_year,
            'is_default': self.is_default
        }

class Invoice(db.Model):
    """Model for subscription invoices"""
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=True)
    stripe_invoice_id = db.Column(db.String(100), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='usd')
    status = db.Column(db.String(20), nullable=False)  # 'paid', 'open', 'void', 'uncollectible'
    invoice_pdf = db.Column(db.String(255), nullable=True)
    invoice_date = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='invoices')
    subscription = db.relationship('Subscription', backref='invoices')
    
    def to_dict(self):
        """Convert invoice to dictionary for API responses"""
        return {
            'id': self.id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'invoice_pdf': self.invoice_pdf,
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None
        }
