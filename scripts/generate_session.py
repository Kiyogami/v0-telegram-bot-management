"""
Generate Telegram String Session
Run this locally to generate a session string for your bot.

Usage:
  python generate_session.py

Requirements:
  pip install telethon
"""

from telethon import TelegramClient
from telethon.sessions import StringSession

print("=== Telegram String Session Generator ===\n")

api_id = input("Enter your API ID: ")
api_hash = input("Enter your API Hash: ")
phone = input("Enter your phone number (with country code, e.g., +48123456789): ")

print("\nConnecting to Telegram...")

with TelegramClient(StringSession(), api_id, api_hash) as client:
    client.start(phone=phone)
    
    print("\n✅ Successfully authorized!")
    print("\n" + "="*60)
    print("Your String Session (copy this):")
    print("="*60)
    print(client.session.save())
    print("="*60)
    print("\n⚠️ Keep this session private! Anyone with it can access your account.")
    print("📋 Copy the string above and paste it in the bot authorization dialog.\n")
