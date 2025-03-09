from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, current_app
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Mail, Message
import datetime
import os
from models import db, User

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

# Initialize Flask-Mail
mail = Mail()

# Create Blueprint
auth_bp = Blueprint('auth', __name__)

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            username = data.get('username')
            password = data.get('password')
            confirm_password = data.get('confirm_password')
        else:
            email = request.form.get('email')
            username = request.form.get('username')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
        
        # Validate input
        if not email or not username or not password:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            flash('Missing required fields', 'danger')
            return render_template('auth/register.html')
        
        if password != confirm_password:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
            flash('Passwords do not match', 'danger')
            return render_template('auth/register.html')
        
        # Check if user already exists
        existing_user = User.query.filter((User.email == email) | (User.username == username)).first()
        if existing_user:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Email or username already in use'}), 400
            flash('Email or username already in use', 'danger')
            return render_template('auth/register.html')
        
        # Create new user
        new_user = User(
            email=email,
            username=username
        )
        new_user.set_password(password)
        
        # Check if we're in development mode
        if os.environ.get('FLASK_ENV') == 'development' or os.environ.get('REPL_ID') is not None:
            # In development mode, automatically verify email
            new_user.email_verified = True
            print(f"Development mode: Auto-verifying email for {email}")
        else:
            # In production mode, generate verification token and send email
            token = generate_verification_token(email)
            new_user.verification_token = token
            # Send verification email
            try:
                send_verification_email(email, token)
            except Exception as e:
                print(f"Error sending verification email: {e}")
                # Still verify the email in case of SMTP errors
                new_user.email_verified = True
        
        # Save user to database
        db.session.add(new_user)
        db.session.commit()
        
        if request.is_json:
            return jsonify({
                'success': True, 
                'message': 'Registration successful. Please check your email to verify your account.'
            }), 201
        
        flash('Registration successful. Please check your email to verify your account.', 'success')
        return redirect(url_for('auth.login'))
    
    # GET request - render registration form
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            email_or_username = data.get('email_or_username')
            password = data.get('password')
            remember = data.get('remember', False)
        else:
            email_or_username = request.form.get('email_or_username')
            password = request.form.get('password')
            remember = request.form.get('remember') == 'on'
        
        # Validate input
        if not email_or_username or not password:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Missing email/username or password'}), 400
            flash('Missing email/username or password', 'danger')
            return render_template('auth/login.html')
        
        # Find user by email or username
        user = User.query.filter(
            (User.email == email_or_username) | (User.username == email_or_username)
        ).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            if request.is_json:
                return jsonify({'success': False, 'message': 'Invalid email/username or password'}), 401
            flash('Invalid email/username or password', 'danger')
            return render_template('auth/login.html')
        
        # Check if email is verified
        if not user.email_verified:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Please verify your email before logging in'}), 401
            flash('Please verify your email before logging in', 'warning')
            return render_template('auth/login.html')
        
        # Log in user
        login_user(user, remember=remember)
        
        # Update last login timestamp
        user.last_login = datetime.datetime.utcnow()
        db.session.commit()
        
        if request.is_json:
            return jsonify({
                'success': True, 
                'message': 'Login successful',
                'user': user.to_dict()
            })
        
        # Redirect to next page or dashboard
        next_page = request.args.get('next')
        if next_page:
            return redirect(next_page)
        return redirect(url_for('home'))
    
    # GET request - render login form
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    
    if request.is_json:
        return jsonify({'success': True, 'message': 'Logout successful'})
    
    flash('You have been logged out', 'info')
    return redirect(url_for('home'))

@auth_bp.route('/verify/<token>')
def verify_email(token):
    email = verify_token(token)
    if not email:
        flash('The verification link is invalid or has expired', 'danger')
        return redirect(url_for('auth.login'))
    
    user = User.query.filter_by(email=email).first()
    if not user:
        flash('User not found', 'danger')
        return redirect(url_for('auth.login'))
    
    if user.email_verified:
        flash('Email already verified', 'info')
        return redirect(url_for('auth.login'))
    
    user.email_verified = True
    user.verification_token = None
    db.session.commit()
    
    flash('Email verified successfully. You can now log in.', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/resend-verification')
def resend_verification():
    if current_user.is_authenticated:
        if current_user.email_verified:
            flash('Your email is already verified', 'info')
            return redirect(url_for('home'))
        
        token = generate_verification_token(current_user.email)
        current_user.verification_token = token
        db.session.commit()
        
        send_verification_email(current_user.email, token)
        
        flash('A new verification email has been sent', 'success')
        return redirect(url_for('home'))
    
    return redirect(url_for('auth.login'))

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
        else:
            email = request.form.get('email')
        
        if not email:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Email is required'}), 400
            flash('Email is required', 'danger')
            return render_template('auth/forgot_password.html')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal that the user doesn't exist
            if request.is_json:
                return jsonify({'success': True, 'message': 'If your email is registered, you will receive a password reset link'})
            flash('If your email is registered, you will receive a password reset link', 'info')
            return redirect(url_for('auth.login'))
        
        # Generate reset token
        token = generate_reset_token(email)
        
        # Send reset email
        send_reset_email(email, token)
        
        if request.is_json:
            return jsonify({'success': True, 'message': 'Password reset link sent to your email'})
        
        flash('Password reset link sent to your email', 'info')
        return redirect(url_for('auth.login'))
    
    # GET request - render forgot password form
    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    email = verify_token(token, salt='password-reset-salt', max_age=3600)
    if not email:
        flash('The password reset link is invalid or has expired', 'danger')
        return redirect(url_for('auth.forgot_password'))
    
    user = User.query.filter_by(email=email).first()
    if not user:
        flash('User not found', 'danger')
        return redirect(url_for('auth.login'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not password or not confirm_password:
            flash('Both password fields are required', 'danger')
            return render_template('auth/reset_password.html', token=token)
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return render_template('auth/reset_password.html', token=token)
        
        # Update password
        user.set_password(password)
        db.session.commit()
        
        flash('Your password has been updated. You can now log in with your new password.', 'success')
        return redirect(url_for('auth.login'))
    
    # GET request - render reset password form
    return render_template('auth/reset_password.html', token=token)

@auth_bp.route('/profile')
@login_required
def profile():
    return render_template('auth/profile.html')

@auth_bp.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    if request.is_json:
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        bio = data.get('bio')
        target_language = data.get('target_language')
        proficiency_level = data.get('proficiency_level')
    else:
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        bio = request.form.get('bio')
        target_language = request.form.get('target_language')
        proficiency_level = request.form.get('proficiency_level')
    
    # Update user profile
    current_user.first_name = first_name
    current_user.last_name = last_name
    current_user.bio = bio
    
    if target_language:
        current_user.target_language = target_language
    
    if proficiency_level:
        current_user.proficiency_level = proficiency_level
    
    db.session.commit()
    
    if request.is_json:
        return jsonify({
            'success': True, 
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        })
    
    flash('Profile updated successfully', 'success')
    return redirect(url_for('auth.profile'))

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    if request.is_json:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
    else:
        current_password = request.form.get('current_password')
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')
    
    # Validate input
    if not current_password or not new_password or not confirm_password:
        if request.is_json:
            return jsonify({'success': False, 'message': 'All password fields are required'}), 400
        flash('All password fields are required', 'danger')
        return redirect(url_for('auth.profile'))
    
    if new_password != confirm_password:
        if request.is_json:
            return jsonify({'success': False, 'message': 'New passwords do not match'}), 400
        flash('New passwords do not match', 'danger')
        return redirect(url_for('auth.profile'))
    
    # Check current password
    if not current_user.check_password(current_password):
        if request.is_json:
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
        flash('Current password is incorrect', 'danger')
        return redirect(url_for('auth.profile'))
    
    # Update password
    current_user.set_password(new_password)
    db.session.commit()
    
    if request.is_json:
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    
    flash('Password updated successfully', 'success')
    return redirect(url_for('auth.profile'))

# Helper functions
def generate_verification_token(email):
    """Generate a token for email verification"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-verification-salt')

def verify_token(token, salt='email-verification-salt', max_age=86400):
    """Verify a token and return the email if valid"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt=salt, max_age=max_age)
        return email
    except:
        return None

def generate_reset_token(email):
    """Generate a token for password reset"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='password-reset-salt')

def send_verification_email(email, token):
    """Send verification email to user"""
    verify_url = url_for('auth.verify_email', token=token, _external=True)
    
    msg = Message(
        'Verify Your Email - ¡Salud! Language Learning Platform',
        recipients=[email],
        sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@salud.com')
    )
    
    msg.body = f'''To verify your email address, visit the following link:
{verify_url}

If you did not register for ¡Salud! Language Learning Platform, please ignore this email.
'''
    
    msg.html = f'''
<p>To verify your email address, click the button below:</p>
<p><a href="{verify_url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
<p>Or copy and paste the following link in your browser:</p>
<p>{verify_url}</p>
<p>If you did not register for ¡Salud! Language Learning Platform, please ignore this email.</p>
'''
    
    mail.send(msg)

def send_reset_email(email, token):
    """Send password reset email to user"""
    reset_url = url_for('auth.reset_password', token=token, _external=True)
    
    msg = Message(
        'Reset Your Password - ¡Salud! Language Learning Platform',
        recipients=[email],
        sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@salud.com')
    )
    
    msg.body = f'''To reset your password, visit the following link:
{reset_url}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email.
'''
    
    msg.html = f'''
<p>To reset your password, click the button below:</p>
<p><a href="{reset_url}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
<p>Or copy and paste the following link in your browser:</p>
<p>{reset_url}</p>
<p>This link will expire in 1 hour.</p>
<p>If you did not request a password reset, please ignore this email.</p>
'''
    
    mail.send(msg)
