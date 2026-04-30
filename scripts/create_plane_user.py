#!/usr/bin/env python
"""Create Plane admin user"""
import os
import sys

# Set working directory
os.chdir('/code')
sys.path.insert(0, '/code')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.selfhosted')

import django
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Check if user exists
if User.objects.filter(email='admin@knowledge.local').exists():
    print('User admin@knowledge.local already exists')
    sys.exit(0)

# Create user
user = User.objects.create_user(
    email='admin@knowledge.local',
    username='admin',
    password='Admin@2024!',
    first_name='Admin',
    last_name='User'
)

# Make user instance admin
user.is_superuser = True
user.is_staff = True
user.save()

print(f'Created admin user: {user.email}')
print('Password: Admin@2024!')
