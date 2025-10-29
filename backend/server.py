# # server.py - WebSocket server for real-time translation
# import asyncio
# import websockets
# import json
# import speech_recognition as sr
# from deep_translator import GoogleTranslator
# from gtts import gTTS
# import base64
# import io
# from pydub import AudioSegment
# import tempfile
# import os

# # Set FFmpeg path explicitly for pydub
# AudioSegment.converter = r"C:\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe"

# # Store connected clients with their language preferences
# clients = {}

# async def process_audio(audio_base64, source_lang, target_lang):
#     """Process audio: Speech-to-Text -> Translate -> Text-to-Speech"""
#     try:
#         # Decode base64 audio
#         audio_bytes = base64.b64decode(audio_base64)
        
#         # Save to temporary file
#         with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
#             temp_webm.write(audio_bytes)
#             temp_webm_path = temp_webm.name
        
#         # Convert to WAV
#         sound = AudioSegment.from_file(temp_webm_path, format="webm")
#         wav_path = temp_webm_path.replace('.webm', '.wav')
#         sound.export(wav_path, format="wav")
        
#         # Speech Recognition
#         recognizer = sr.Recognizer()
#         with sr.AudioFile(wav_path) as source:
#             audio_data = recognizer.record(source)
#             text = recognizer.recognize_google(audio_data, language=source_lang)
        
#         print(f"📝 Recognized ({source_lang}): {text}")
        
#         # Translate
#         if source_lang != target_lang:
#             translator = GoogleTranslator(source=source_lang, target=target_lang)
#             translated_text = translator.translate(text)
#         else:
#             translated_text = text
        
#         print(f"🌍 Translated ({target_lang}): {translated_text}")
        
#         # Text-to-Speech - Save to temporary file
#         tts = gTTS(translated_text, lang=target_lang, slow=False)
#         mp3_path = wav_path.replace('.wav', '.mp3')
#         tts.save(mp3_path)
        
#         # Read the MP3 file and encode to base64
#         with open(mp3_path, 'rb') as audio_file:
#             audio_bytes = audio_file.read()
#             translated_audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
#         # Cleanup
#         os.unlink(temp_webm_path)
#         os.unlink(wav_path)
#         os.unlink(mp3_path)
        
#         return {
#             'original_text': text,
#             'translated_text': translated_text,
#             'audio': translated_audio_base64
#         }
    
#     except Exception as e:
#         print(f"❌ Error processing audio: {e}")
#         import traceback
#         traceback.print_exc()
#         return None

# async def handle_client(websocket):
#     """Handle WebSocket connections"""
#     client_id = id(websocket)
#     print(f"✅ Client {client_id} connected")
    
#     try:
#         async for message in websocket:
#             data = json.loads(message)
            
#             if data['type'] == 'register':
#                 # Register client with language preference
#                 clients[client_id] = {
#                     'websocket': websocket,
#                     'lang': data['lang'],
#                     'name': data.get('name', f'User_{client_id}')
#                 }
#                 print(f"👤 {clients[client_id]['name']} registered (lang: {data['lang']})")
                
#                 # Notify all clients
#                 await broadcast({
#                     'type': 'user_joined',
#                     'user': clients[client_id]['name'],
#                     'lang': data['lang']
#                 })
            
#             elif data['type'] == 'audio':
#                 # Process audio and broadcast translations
#                 source_lang = clients[client_id]['lang']
#                 audio_base64 = data['audio']
#                 speaker_name = clients[client_id]['name']
                
#                 print(f"🎙️ Processing audio from {speaker_name} ({source_lang})")
                
#                 # Broadcast to all other clients with translation
#                 for other_id, other_client in clients.items():
#                     if other_id != client_id:
#                         target_lang = other_client['lang']
                        
#                         # Process translation
#                         result = await process_audio(audio_base64, source_lang, target_lang)
                        
#                         if result:
#                             await other_client['websocket'].send(json.dumps({
#                                 'type': 'translated_audio',
#                                 'speaker': speaker_name,
#                                 'original_text': result['original_text'],
#                                 'translated_text': result['translated_text'],
#                                 'audio': result['audio']
#                             }))
#                             print(f"✅ Sent translation to {other_client['name']}")
    
#     except websockets.exceptions.ConnectionClosed:
#         print(f"❌ Client {client_id} disconnected")
    
#     finally:
#         if client_id in clients:
#             name = clients[client_id]['name']
#             del clients[client_id]
#             await broadcast({
#                 'type': 'user_left',
#                 'user': name
#             })

# async def broadcast(message):
#     """Broadcast message to all connected clients"""
#     if clients:
#         await asyncio.gather(
#             *[client['websocket'].send(json.dumps(message)) for client in clients.values()],
#             return_exceptions=True
#         )

# async def main():
#     print("🚀 Starting translation meeting server on ws://localhost:8765")
#     async with websockets.serve(handle_client, "localhost", 8765):
#         await asyncio.Future()  # Run forever

# if __name__ == "__main__":
#     asyncio.run(main())



# server.py - WebSocket server for real-time translation
import asyncio
import websockets
import json
import speech_recognition as sr
from deep_translator import GoogleTranslator
from gtts import gTTS
import base64
import io
from pydub import AudioSegment
import tempfile
import os
import sys
from pathlib import Path

# Try to find FFmpeg automatically
def find_ffmpeg():
    """Try to find FFmpeg in common locations"""
    # Check if ffmpeg is in PATH
    import shutil
    if shutil.which("ffmpeg"):
        print("✅ FFmpeg found in system PATH")
        return True
    
    # Common Windows locations
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\ffmpeg-8.0-essentials_build\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        Path.home() / "ffmpeg" / "bin" / "ffmpeg.exe",
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            AudioSegment.converter = str(path)
            print(f"✅ FFmpeg found at: {path}")
            return True
    
    print("❌ FFmpeg not found!")
    print("Please install FFmpeg:")
    print("1. Download from: https://www.gyan.dev/ffmpeg/builds/")
    print("2. Extract to C:\\ffmpeg\\")
    print("3. Or add FFmpeg to your system PATH")
    return False

# Try to configure FFmpeg
if not find_ffmpeg():
    print("\n⚠️ Server starting WITHOUT FFmpeg - audio conversion will fail!")
    print("Press Ctrl+C to stop and install FFmpeg first.\n")

# Store connected clients with their language preferences
clients = {}

async def process_audio(audio_base64, source_lang, target_lang):
    """Process audio: Speech-to-Text -> Translate -> Text-to-Speech"""
    temp_webm_path = None
    wav_path = None
    mp3_path = None
    
    try:
        print(f"📥 Received audio data: {len(audio_base64)} chars")
        
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_base64)
        print(f"📦 Decoded to {len(audio_bytes)} bytes")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
            temp_webm.write(audio_bytes)
            temp_webm_path = temp_webm.name
        print(f"💾 Saved to temp file: {temp_webm_path}")
        
        # Convert to WAV
        print("🔄 Converting WebM to WAV...")
        sound = AudioSegment.from_file(temp_webm_path, format="webm")
        wav_path = temp_webm_path.replace('.webm', '.wav')
        sound.export(wav_path, format="wav")
        print(f"✅ Converted to WAV: {wav_path}")
        
        # Speech Recognition
        print(f"🎤 Recognizing speech in {source_lang}...")
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data, language=source_lang)
        
        print(f"📝 Recognized ({source_lang}): {text}")
        
        # Translate
        if source_lang != target_lang:
            print(f"🌍 Translating {source_lang} -> {target_lang}...")
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated_text = translator.translate(text)
        else:
            translated_text = text
        
        print(f"✅ Translated ({target_lang}): {translated_text}")
        
        # Text-to-Speech - Save to temporary file
        print(f"🔊 Generating speech in {target_lang}...")
        tts = gTTS(translated_text, lang=target_lang, slow=False)
        mp3_path = wav_path.replace('.wav', '.mp3')
        tts.save(mp3_path)
        print(f"✅ Generated audio: {mp3_path}")
        
        # Read the MP3 file and encode to base64
        with open(mp3_path, 'rb') as audio_file:
            audio_bytes = audio_file.read()
            translated_audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"📤 Encoded audio: {len(translated_audio_base64)} chars")
        
        return {
            'original_text': text,
            'translated_text': translated_text,
            'audio': translated_audio_base64
        }
    
    except FileNotFoundError as e:
        print(f"❌ File not found error: {e}")
        print("This usually means FFmpeg is not installed or not in PATH")
        return None
    except sr.UnknownValueError:
        print("❌ Speech recognition could not understand audio")
        return None
    except sr.RequestError as e:
        print(f"❌ Speech recognition service error: {e}")
        return None
    except Exception as e:
        print(f"❌ Error processing audio: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        # Cleanup temporary files
        for path in [temp_webm_path, wav_path, mp3_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    print(f"🗑️ Cleaned up: {path}")
                except:
                    pass

async def handle_client(websocket):
    """Handle WebSocket connections"""
    client_id = id(websocket)
    print(f"✅ Client {client_id} connected")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            
            if data['type'] == 'register':
                # Register client with language preference
                clients[client_id] = {
                    'websocket': websocket,
                    'lang': data['lang'],
                    'name': data.get('name', f'User_{client_id}')
                }
                print(f"👤 {clients[client_id]['name']} registered (lang: {data['lang']})")
                print(f"📊 Total clients: {len(clients)}")
                
                # Notify all clients
                await broadcast({
                    'type': 'user_joined',
                    'user': clients[client_id]['name'],
                    'lang': data['lang']
                })
            
            elif data['type'] == 'audio':
                # Process audio and broadcast translations
                source_lang = clients[client_id]['lang']
                audio_base64 = data['audio']
                speaker_name = clients[client_id]['name']
                
                print(f"\n{'='*60}")
                print(f"🎙️ Processing audio from {speaker_name} ({source_lang})")
                print(f"{'='*60}")
                
                # Broadcast to all other clients with translation
                for other_id, other_client in clients.items():
                    if other_id != client_id:
                        target_lang = other_client['lang']
                        print(f"\n🔄 Translating for {other_client['name']} ({target_lang})...")
                        
                        # Process translation
                        result = await process_audio(audio_base64, source_lang, target_lang)
                        
                        if result:
                            await other_client['websocket'].send(json.dumps({
                                'type': 'translated_audio',
                                'speaker': speaker_name,
                                'original_text': result['original_text'],
                                'translated_text': result['translated_text'],
                                'audio': result['audio']
                            }))
                            print(f"✅ Sent translation to {other_client['name']}")
                        else:
                            print(f"❌ Failed to process audio for {other_client['name']}")
                
                print(f"{'='*60}\n")
    
    except websockets.exceptions.ConnectionClosed:
        print(f"❌ Client {client_id} disconnected")
    
    finally:
        if client_id in clients:
            name = clients[client_id]['name']
            del clients[client_id]
            print(f"👋 {name} left (remaining: {len(clients)})")
            await broadcast({
                'type': 'user_left',
                'user': name
            })

async def broadcast(message):
    """Broadcast message to all connected clients"""
    if clients:
        await asyncio.gather(
            *[client['websocket'].send(json.dumps(message)) for client in clients.values()],
            return_exceptions=True
        )

async def main():
    print("\n" + "="*60)
    print("🚀 Starting Real-time Translation Server")
    print("="*60)
    print("📍 WebSocket: ws://localhost:8765")
    print("📝 Make sure clients connect to this address")
    print("⚠️  Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    async with websockets.serve(handle_client, "localhost", 8765):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
        sys.exit(0)