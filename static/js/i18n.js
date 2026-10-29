/* MindEase Hindi layer. English is the source text; when the language is Hindi, text that matches
   an entry below is swapped in the page (including text added later). Anything not listed stays English. */
(function () {
  'use strict';
  var lang = (function () { try { return (JSON.parse(localStorage.getItem('mindease.prefs')) || {}).lang; } catch (e) { return ''; } })();
  if (lang !== 'hi') return;

  var D = {
    "Keeper view": "कीपर व्यू", "Sharing": "साझा करना", "Today's plan": "आज की योजना", "Edit": "संपादित करें", "Done": "हो गया", "All done. That is a real win.": "सब हो गया। यह सचमुच जीत है।",
    "Check in with your mood": "अपने मूड का चेक-इन करें", "Do one breathing round": "एक साँस का राउंड करें", "Write a line in your journal": "जर्नल में एक पंक्ति लिखें", "Name one good thing": "एक अच्छी बात बताएँ",
    " · goes in by itself": " · अपने आप हो जाएगा", "Add": "जोड़ें", "Remove": "हटाएँ", "Up to ten tasks": "अधिकतम दस काम",
    "Let someone keep an eye on you": "किसी को अपना ध्यान रखने दें", "Invite someone": "किसी को आमंत्रित करें", "Create invite code": "आमंत्रण कोड बनाएँ", "Copy invite": "आमंत्रण कॉपी करें", "Stop sharing": "साझा करना बंद करें",
    "Moods and energy": "मूड और ऊर्जा", "What is behind it": "इसके पीछे क्या है", "Your check-in notes": "आपके चेक-इन नोट", "Journal entries": "जर्नल प्रविष्टियाँ", "Daily plan progress": "दैनिक योजना की प्रगति", "Gentle heads-up": "हल्की सूचना",
    "Join with a code": "कोड से जुड़ें", "Join": "जुड़ें", "Worth a gentle check-in": "एक कोमल हालचाल के लायक", "Last 30 days": "पिछले 30 दिन", "← Everyone": "← सभी", "You are not looking after anyone yet.": "आप अभी किसी का ध्यान नहीं रख रहे हैं।",
    "Sign in first": "पहले साइन इन करें", "Sign in or create an account": "साइन इन करें या खाता बनाएँ",
    "Today": "आज", "Insights": "इनसाइट्स", "Journal": "जर्नल", "Programs": "प्रोग्राम", "Study mode": "पढ़ाई मोड", "My space": "मेरी जगह", "More": "और",
    "Home page": "होम पेज", "← Back to home page": "← होम पेज पर वापस", "Calm": "शांति", "Track": "ट्रैक", "Grow": "विकास", "Me": "मैं",
    "How do you feel right now?": "आप अभी कैसा महसूस कर रहे हैं?", "Anything to add?": "कुछ जोड़ना है?", "(optional)": "(वैकल्पिक)",
    "What's on your mind?": "आपके मन में क्या है?", "Open your journal →": "अपना जर्नल खोलें →", "Your patterns": "आपके पैटर्न",
    "See how your moods, energy and days fit together. Everything stays on this device.": "देखें कि आपका मूड, ऊर्जा और दिन कैसे जुड़ते हैं। सब कुछ इसी डिवाइस पर रहता है।",
    "Your journal": "आपका जर्नल", "A private place to write. Nobody else can read it.": "लिखने की एक निजी जगह। कोई और इसे नहीं पढ़ सकता।",
    "Guided programs": "निर्देशित प्रोग्राम", "Short step-by-step plans for sleep, exams and low days.": "नींद, परीक्षा और मुश्किल दिनों के लिए छोटी चरण-दर-चरण योजनाएँ।",
    "Focus rounds with calm breaks built in.": "शांत ब्रेक के साथ फ़ोकस राउंड।", "Your safety plan, reminders and settings.": "आपकी सुरक्षा योजना, रिमाइंडर और सेटिंग्स।",
    "Good morning": "सुप्रभात", "Good afternoon": "नमस्कार", "Good evening": "शुभ संध्या", "Good night": "शुभ रात्रि", "Badges": "बैज",
    /* shared / nav */
    "MindEase": "माइंडईज़", "What's inside": "अंदर क्या है", "How it works": "कैसे काम करता है", "Need help now?": "अभी मदद चाहिए?", "Help": "मदद",
    "Open the app": "ऐप खोलें", "Home": "होम", "Sign in": "साइन इन", "Skip to content": "सीधे सामग्री पर जाएँ",
    "Mood": "मूड", "Breathe": "साँस", "Ground": "ठहराव", "Words": "शब्द", "Play": "खेल", "You": "आप",
    "Sound": "आवाज़", "Sound effects": "ध्वनि प्रभाव", "Ambient background": "पृष्ठभूमि की आवाज़", "Off": "बंद", "Rain": "बारिश", "Ocean": "समुद्र", "Warm hum": "गर्म गुंजन",
    "Volume": "आवाज़ का स्तर", "Voice guide": "आवाज़ से मार्गदर्शन", "The voice guide speaks breathing steps out loud.": "यह साँस के चरण बोलकर बताता है (अंग्रेज़ी में)।",
    "Background sound": "पृष्ठभूमि की आवाज़",
    /* landing */
    "How are you, really?": "सच में, आप कैसे हैं?", "A cozy corner for your feelings. Log your mood in under a minute, then settle in with breathing, grounding, kind words and small games.": "आपकी भावनाओं के लिए एक आरामदायक कोना। एक मिनट से कम में अपना मूड लिखें, फिर साँस, ठहराव, अच्छे शब्दों और छोटे खेलों के साथ सुकून पाएँ।",
    "Check in now": "अभी चेक-इन करें", "See what's inside": "देखें अंदर क्या है", "Pick a mood. The whole room follows.": "एक मूड चुनें। पूरा कमरा उसके साथ बदलेगा।",
    "A little room for every kind of day": "हर तरह के दिन के लिए थोड़ी जगह", "Pick the one that fits how you feel right now. Each takes a few minutes.": "जो अभी आपके एहसास से मेल खाए, वह चुनें। हर एक में बस कुछ मिनट लगते हैं।",
    "Mood log": "मूड लॉग", "Pick a face, set your energy and add a note if you want. Your week appears as a chart so patterns are easy to spot.": "एक चेहरा चुनें, ऊर्जा तय करें और चाहें तो नोट जोड़ें। आपका हफ़्ता चार्ट में दिखता है ताकि पैटर्न आसानी से दिखें।",
    "Breathing": "साँस", "Six techniques, including box breathing and 4-7-8, with a glowing orb that shows when to breathe in, hold and let go.": "बॉक्स ब्रीदिंग और 4-7-8 सहित छह तरीके, और एक चमकता गोला जो बताता है कब साँस लेनी, रोकनी और छोड़नी है।",
    "Grounding": "ठहराव", "The 5-4-3-2-1 senses exercise and a slow body scan to bring you back to the room you're in.": "5-4-3-2-1 इंद्रिय अभ्यास और धीमा बॉडी स्कैन, जो आपको वापस आपके आस-पास ले आए।",
    "Affirmations": "सकारात्मक वाक्य", "Short, kind lines in five categories. Tap the heart to keep the ones that help.": "पाँच श्रेणियों में छोटे, कोमल वाक्य। जो पसंद आएँ उन्हें दिल दबाकर सहेजें।",
    "Calm games": "शांत खेल", "Memory match, bubbles, word tiles and a gratitude jar to give a busy mind something gentle to do.": "मेमोरी मैच, बुलबुले, शब्द टाइल और आभार जार, ताकि व्यस्त मन को कुछ कोमल करने को मिले।",
    "A check-in takes about a minute": "एक चेक-इन में लगभग एक मिनट लगता है", "No sign-up questions and no long forms. This is the whole thing.": "न लंबे फ़ॉर्म, न ढेर सारे सवाल। बस इतना ही।",
    "Pick a face": "एक चेहरा चुनें", "Choose the Mo that looks like how you feel right now.": "वह मो चुनें जो अभी आपके एहसास जैसा दिखे।",
    "Set your energy": "ऊर्जा तय करें", "Slide from drained to buzzing.": "थकान से जोश तक स्लाइड करें।", "Add a line": "एक पंक्ति जोड़ें", "Write what's on your mind, or skip it.": "मन में जो है लिखें, या छोड़ दें।",
    "See your week": "अपना हफ़्ता देखें", "Your chart fills in as you log more days.": "जैसे-जैसे आप दिन दर्ज करेंगे, चार्ट भरता जाएगा।",
    "Ready when you are": "जब आप तैयार हों", "Grab a warm drink. We'll start with one question.": "कुछ गर्म पी लें। हम एक सवाल से शुरू करेंगे।", "Open MindEase": "माइंडईज़ खोलें",
    "MindEase is a self-care tool, not medical advice.": "माइंडईज़ खुद की देखभाल का एक साधन है, चिकित्सा सलाह नहीं।",
    "If you are in crisis or thinking about hurting yourself, contact your local emergency number or a helpline right away. In India, Tele-MANAS is free at 14416.": "अगर आप संकट में हैं या खुद को नुकसान पहुँचाने के बारे में सोच रहे हैं, तो तुरंत अपने स्थानीय आपातकालीन नंबर या हेल्पलाइन से संपर्क करें। भारत में टेली-मानस 14416 पर मुफ़्त है।",
    "Made with care in Bhopal": "भोपाल में प्यार से बनाया गया",
    /* moods */
    "Very happy": "बहुत खुश", "Happy": "खुश", "Grateful": "आभारी", "Calm": "शांत", "Neutral": "सामान्य", "Tired": "थका हुआ", "Sad": "उदास", "Anxious": "चिंतित", "Overwhelmed": "बोझिल", "Angry": "गुस्से में",
    "Look at you glowing. Log it so you can remember it.": "कितनी अच्छी बात है! इसे लिख लें ताकि याद रहे।", "A good moment is worth noticing.": "एक अच्छे पल पर ध्यान देना अच्छा है।",
    "Hold that warm feeling for one more breath.": "उस गर्माहट को एक और साँस तक थामे रखें।", "Steady and soft. Keep it going.": "स्थिर और कोमल। इसे बनाए रखें।",
    "Okay is okay. Nothing has to be big today.": "ठीक-ठाक होना भी ठीक है। आज कुछ बड़ा नहीं करना है।", "Rest counts. Go easy on yourself.": "आराम भी मायने रखता है। खुद पर नरमी रखें।",
    "That sounds heavy. I'm here. Maybe a few slow breaths?": "यह भारी लगता है। मैं यहाँ हूँ। शायद कुछ धीमी साँसें?", "That's a lot to carry. Let's slow things down together.": "यह बहुत बोझ है। चलिए साथ मिलकर धीमे हो जाएँ।",
    "One small thing at a time. Start with a breath.": "एक बार में एक छोटी चीज़। एक साँस से शुरू करें।", "Big feelings need room. Try one long exhale.": "बड़ी भावनाओं को जगह चाहिए। एक लंबी साँस छोड़कर देखें।",
    "Tap a face and I will keep you company.": "एक चेहरा चुनें, मैं आपके साथ हूँ।", "Mo keeps you company": "मो आपके साथ है",
    /* mood page */
    "How are you feeling today?": "आज आप कैसा महसूस कर रहे हैं?", "Pick the face that fits. There's no wrong answer.": "जो चेहरा मेल खाए वह चुनें। कोई जवाब गलत नहीं है।",
    "Pick your mood": "अपना मूड चुनें", "Add a note": "नोट जोड़ें", "What is behind it?": "इसके पीछे क्या है?", "(optional)": "(वैकल्पिक)",
    "Sleep": "नींद", "Studies": "पढ़ाई", "Exams": "परीक्षा", "Family": "परिवार", "Friends": "दोस्त", "Health": "सेहत", "Food": "खाना", "Exercise": "व्यायाम", "Weather": "मौसम", "Money": "पैसे", "Screen time": "स्क्रीन टाइम", "Work": "काम",
    "Energy level": "ऊर्जा का स्तर", "Drained": "थका-हारा", "Buzzing": "जोश में", "Save check-in": "चेक-इन सहेजें",
    "Your week": "आपका हफ़्ता", "day streak": "दिन लगातार", "check-ins": "चेक-इन", "Badges": "बैज", "Recent check-ins": "हाल के चेक-इन",
    "First check-in": "पहला चेक-इन", "3-day streak": "3 दिन लगातार", "A week of showing up": "एक हफ़्ता लगातार", "10 check-ins": "10 चेक-इन", "Two-week streak": "दो हफ़्ते लगातार", "50 check-ins": "50 चेक-इन", "A month of care": "एक महीने की देखभाल",
    "No check-ins yet. Pick a face above to start.": "अभी कोई चेक-इन नहीं। शुरू करने के लिए ऊपर से एक चेहरा चुनें।",
    "Saved. Thanks for checking in.": "सहेज लिया। चेक-इन करने के लिए धन्यवाद।", "Pick a face first": "पहले एक चेहरा चुनें", "New badge earned": "नया बैज मिला",
    "Mon": "सोम", "Tue": "मंगल", "Wed": "बुध", "Thu": "गुरु", "Fri": "शुक्र", "Sat": "शनि", "Sun": "रवि", "Just now": "अभी-अभी",
    /* suggestions */
    "Let's slow things down": "चलिए धीमे हो जाएँ", "A steady square breath is a good place to start.": "बॉक्स ब्रीदिंग शुरू करने का अच्छा तरीका है।", "Box breathing": "बॉक्स ब्रीदिंग", "5-4-3-2-1 grounding": "5-4-3-2-1 ठहराव",
    "One small thing at a time": "एक बार में एक छोटी चीज़", "Grounding can bring you back to the room around you.": "ठहराव आपको आपके आस-पास वापस ला सकता है।", "Quick reset": "झटपट रीसेट",
    "Give the feeling some room": "भावना को थोड़ी जगह दें", "A longer exhale helps your body settle.": "लंबी साँस छोड़ने से शरीर शांत होता है।", "Belly breathing": "पेट से साँस", "Temperature reset": "तापमान रीसेट",
    "Something gentle for a heavy moment": "भारी पल के लिए कुछ कोमल", "Kind words or a few good things can soften the edges.": "अच्छे शब्द या कुछ अच्छी बातें मन को हल्का कर सकती हैं।", "Kind words": "अच्छे शब्द", "Gratitude jar": "आभार जार",
    "Rest counts": "आराम भी मायने रखता है", "A slow body scan can help you unwind.": "धीमा बॉडी स्कैन आराम पाने में मदद कर सकता है।",
    "A calm in-between day": "एक शांत बीच का दिन", "Something small and playful keeps things light.": "कुछ छोटा और खेल-भरा मन हल्का रखता है।", "Color match": "रंग मिलाओ", "Write in your journal": "डायरी में लिखें",
    "Keep that steady feeling": "यह स्थिरता बनाए रखें", "Slow even breaths can hold it a little longer.": "धीमी, बराबर साँसें इसे थोड़ा और टिकाए रख सकती हैं।", "Coherence": "समानता साँस", "Growth words": "विकास के शब्द",
    "Save the good moment": "अच्छे पल को सहेजें", "A good thing in the jar is easy to find on harder days.": "जार में रखी अच्छी बात कठिन दिनों में आसानी से मिल जाती है।", "Keep it warm": "इसे गर्म रखें", "Add it to your gratitude jar while it is fresh.": "ताज़ा रहते हुए इसे आभार जार में जोड़ दें।",
    "The last few days have sounded heavy. Talking to someone can really help.": "पिछले कुछ दिन भारी लगे हैं। किसी से बात करना सच में मदद कर सकता है।", "See who you can reach": "देखें किससे संपर्क कर सकते हैं",
    /* breathe */
    "Find your rhythm": "अपनी लय खोजें", "Choose a pattern, then follow the glowing orb. Breathe in as it grows and out as it shrinks.": "एक पैटर्न चुनें और चमकते गोले का पालन करें। जब वह बढ़े तब साँस लें, जब छोटा हो तब छोड़ें।",
    "Four equal sides. Steady and grounding.": "चार बराबर भुजाएँ। स्थिर और ठहराव देने वाला।", "4-7-8 breathing": "4-7-8 साँस", "A long exhale to help you wind down.": "लंबी साँस छोड़ना, ताकि आप शांत हो सकें।",
    "Even, slow breaths at an easy pace.": "आराम की गति से बराबर, धीमी साँसें।", "A longer exhale to settle your body.": "शरीर को शांत करने के लिए लंबी साँस छोड़ना।", "A short, light round to freshen up.": "तरोताज़ा होने के लिए एक छोटा, हल्का दौर।", "Triangle": "त्रिकोण", "Breathe in, hold, breathe out.": "साँस लें, रोकें, छोड़ें।",
    "Ready": "तैयार", "Start": "शुरू", "Reset": "रीसेट", "Pause": "रोकें", "Resume": "जारी रखें", "Breathe in": "साँस लें", "Hold": "रोकें", "Breathe out": "साँस छोड़ें",
    /* ground */
    "Come back to the present": "वर्तमान में लौटें", "Small exercises that bring your attention back to the room you're in.": "छोटे अभ्यास जो आपका ध्यान वापस आपके आस-पास ले आते हैं।",
    "5-4-3-2-1 senses": "5-4-3-2-1 इंद्रियाँ", "Body scan": "बॉडी स्कैन", "Safe place": "सुरक्षित जगह", "Name things around you for each sense and tap them as you notice them.": "हर इंद्रिय के लिए आस-पास की चीज़ें पहचानें और ध्यान देते ही उन्हें दबाएँ।",
    "See": "देखें", "Five things you can see": "पाँच चीज़ें जो आप देख सकते हैं", "A chair": "एक कुर्सी", "The wall": "दीवार", "A window": "एक खिड़की", "A lamp": "एक लैंप", "Your hands": "आपके हाथ",
    "Hear": "सुनें", "Four things you can hear": "चार चीज़ें जो आप सुन सकते हैं", "A sound nearby": "पास की कोई आवाज़", "Distant noise": "दूर का शोर", "Your breathing": "आपकी साँस", "Something subtle": "कुछ हल्का-सा",
    "Touch": "छुएँ", "Three things you can feel": "तीन चीज़ें जो आप महसूस कर सकते हैं", "The surface beneath you": "आपके नीचे की सतह", "Your clothing": "आपके कपड़े", "Something within reach": "पहुँच में कोई चीज़",
    "Smell": "सूँघें", "Two things you can smell": "दो चीज़ें जो आप सूँघ सकते हैं", "The air around you": "आपके आस-पास की हवा", "Something nearby": "पास में कुछ", "Taste": "स्वाद", "One thing you can taste": "एक चीज़ जिसका स्वाद आप ले सकते हैं", "The taste in your mouth": "आपके मुँह का स्वाद",
    "Noticed": "ध्यान दिया", "of 15": "/ 15",
    "Move your attention slowly through your body, one area at a time.": "अपना ध्यान धीरे-धीरे शरीर में घुमाएँ, एक हिस्से से दूसरे तक।",
    "Crown of your head": "सिर का ऊपरी हिस्सा", "Notice any tension, tingling or warmth at the very top.": "सबसे ऊपर किसी तनाव, झुनझुनी या गर्माहट पर ध्यान दें।",
    "Face and jaw": "चेहरा और जबड़ा", "Soften your forehead and eyes. Let your jaw unclench.": "माथे और आँखों को ढीला छोड़ें। जबड़े को खुलने दें।",
    "Neck and shoulders": "गर्दन और कंधे", "Drop your shoulders away from your ears.": "कंधों को कानों से दूर नीचे गिरने दें।",
    "Chest and heart": "छाती और दिल", "Feel each breath gently expand and soften your chest.": "हर साँस को छाती को हल्के से फैलाते और ढीला करते महसूस करें।",
    "Belly": "पेट", "Let your belly go soft. You can stop holding it in.": "पेट को ढीला छोड़ दें। उसे अंदर खींचकर रखना ज़रूरी नहीं।",
    "Hands and arms": "हाथ और बाँहें", "Notice the weight of your arms. Uncurl your fingers.": "बाँहों का वज़न महसूस करें। उँगलियाँ खोल दें।",
    "Legs and feet": "पैर और तलवे", "Feel the ground beneath you and where your feet touch it.": "अपने नीचे की ज़मीन और जहाँ पैर उसे छूते हैं, उसे महसूस करें।", "Start body scan": "बॉडी स्कैन शुरू करें",
    "Close your eyes and picture a place where you feel completely safe. It can be real or imagined.": "आँखें बंद करें और ऐसी जगह की कल्पना करें जहाँ आप पूरी तरह सुरक्षित महसूस करते हैं। वह असली या काल्पनिक हो सकती है।",
    "What do you see?": "आप क्या देखते हैं?", "What do you hear?": "आप क्या सुनते हैं?", "How does it feel?": "कैसा महसूस होता है?", "Your safe word": "आपका सुरक्षित शब्द", "Say it to yourself to return here whenever you like.": "जब चाहें यहाँ लौटने के लिए इसे खुद से कहें।",
    "Cool temperatures can help your body settle. Pick whatever is easy to do right now.": "ठंडा तापमान शरीर को शांत करने में मदद कर सकता है। अभी जो आसान लगे वह चुनें।",
    "Splash cool water": "ठंडा पानी छिड़कें", "On your face and wrists for about 30 seconds.": "चेहरे और कलाइयों पर करीब 30 सेकंड।", "Hold something cold": "कुछ ठंडा पकड़ें", "A chilled glass or ice pack in your hands for a minute. Notice how it feels.": "एक ठंडा गिलास या आइस पैक एक मिनट हाथों में रखें। महसूस करें कैसा लगता है।",
    "Cool air": "ठंडी हवा", "Step outside or sit near a fan and breathe the cool air slowly.": "बाहर निकलें या पंखे के पास बैठें और ठंडी हवा में धीरे-धीरे साँस लें।", "Cool shower finish": "नहाने के अंत में ठंडा पानी", "End your shower with a short rinse of cool water on your neck and shoulders.": "नहाने के अंत में गर्दन और कंधों पर थोड़ा ठंडा पानी डालें।",
    /* words / play */
    "Words that help": "सहारा देने वाले शब्द", "Read one slowly. Tap the heart to keep the ones that land.": "एक को धीरे-धीरे पढ़ें। जो दिल को छुए उसे दिल दबाकर सहेजें।", "Next one": "अगला", "Save this": "इसे सहेजें",
    "All": "सभी", "Anxiety": "चिंता", "Strength": "ताकत", "Gratitude": "आभार", "Growth": "विकास", "Saved ♥": "सहेजे ♥", "Self-worth": "आत्म-सम्मान",
    "Play your way to calm": "खेलते हुए शांत हों", "Gentle games with no timers and no scores to beat.": "कोमल खेल, न टाइमर, न हराने के लिए स्कोर।",
    /* you tab */
    "Your story so far": "अब तक की आपकी कहानी", "Patterns, a calendar, and a private journal. Everything stays on this device.": "पैटर्न, कैलेंडर और एक निजी डायरी। सब कुछ इसी डिवाइस पर रहता है।",
    "Insights": "जानकारी", "Calendar": "कैलेंडर", "Journal": "डायरी", "Weekly": "साप्ताहिक", "Programs": "कार्यक्रम", "Study": "पढ़ाई", "Safety plan": "सुरक्षा योजना", "Reminders": "रिमाइंडर", "Settings": "सेटिंग्स",
    "most common mood": "सबसे आम मूड", "tends to feel best": "सबसे अच्छा महसूस होता है", "needs more days": "और दिन चाहिए", "Not clear yet": "अभी साफ़ नहीं", "average energy": "औसत ऊर्जा",
    "Mood over the last 14 days": "पिछले 14 दिनों का मूड", "Average energy by mood": "मूड के अनुसार औसत ऊर्जा", "high": "ऊँचा", "low": "नीचा",
    "Not enough yet": "अभी काफ़ी नहीं", "After a few check-ins, patterns will show up here. You can also peek at how it looks with sample data.": "कुछ चेक-इन के बाद यहाँ पैटर्न दिखेंगे। आप नमूना डेटा से देख भी सकते हैं।", "Try with sample data": "नमूना डेटा आज़माएँ", "Clear sample data": "नमूना डेटा हटाएँ",
    "What goes with your moods": "आपके मूड के साथ क्या जुड़ा है", "Add tags like Sleep or Exams when you check in. After a few, you will see which ones go with better or harder days.": "चेक-इन करते समय नींद या परीक्षा जैसे टैग जोड़ें। कुछ के बाद दिखेगा कि कौन-से अच्छे या कठिन दिनों के साथ आते हैं।",
    "Tend to go with better days": "बेहतर दिनों के साथ आते हैं", "Tend to go with harder days": "कठिन दिनों के साथ आते हैं", "This shows what happened together, not what caused what.": "यह दिखाता है कि क्या साथ हुआ, यह नहीं कि किसने किसे पैदा किया।",
    "These are patterns in what you logged, not a diagnosis.": "ये आपके दर्ज किए डेटा के पैटर्न हैं, कोई निदान नहीं।",
    "So far there is no clear link between your energy and your mood.": "अब तक आपकी ऊर्जा और मूड के बीच कोई साफ़ संबंध नहीं दिखा।", "So far, higher energy tends to go along with a better mood for you.": "अब तक आपके लिए ज़्यादा ऊर्जा बेहतर मूड के साथ आती दिखी है।",
    "• dot = journal entry": "• बिंदु = डायरी प्रविष्टि", "Write about this day": "इस दिन के बारे में लिखें", "Open this journal entry": "यह डायरी प्रविष्टि खोलें",
    "Entry for": "प्रविष्टि की तारीख", "A good thing": "एक अच्छी बात", "On my mind": "मन में", "What I need": "मुझे क्या चाहिए", "A smile": "एक मुस्कान", "To a friend": "दोस्त से", "Delete entry": "प्रविष्टि हटाएँ", "Search your journal": "अपनी डायरी खोजें",
    "No entries yet. Your first one will show up here.": "अभी कोई प्रविष्टि नहीं। आपकी पहली यहाँ दिखेगी।", "Saved on this device": "इस डिवाइस पर सहेजा गया", "Saving…": "सहेज रहे हैं…",
    "Your week with Mo": "मो के साथ आपका हफ़्ता", "Copy summary": "सारांश कॉपी करें", "Print or save as PDF": "प्रिंट या PDF में सहेजें", "Thank you for showing up for yourself.": "खुद के लिए आने के लिए धन्यवाद।",
    "That is a little brighter than last week.": "यह पिछले हफ़्ते से थोड़ा बेहतर है।", "That is a bit heavier than last week.": "यह पिछले हफ़्ते से थोड़ा भारी है।", "About the same as last week.": "पिछले हफ़्ते जैसा ही।",
    "No check-ins this week yet. A quick one takes under a minute.": "इस हफ़्ते अभी कोई चेक-इन नहीं। एक झटपट चेक-इन में एक मिनट से कम लगता है।", "Whenever you are ready, I am here.": "जब आप तैयार हों, मैं यहाँ हूँ।",
    "Something is working. Notice what you did differently.": "कुछ तो काम कर रहा है। देखें कि आपने क्या अलग किया।", "Harder weeks happen. Be gentle with yourself, and reach out to someone if it keeps feeling heavy.": "कठिन हफ़्ते आते हैं। खुद के साथ नरमी रखें, और अगर भारीपन बना रहे तो किसी से बात करें।",
    "Exam calm": "परीक्षा में शांति", "Seven small steps to meet exams with a steadier mind.": "स्थिर मन से परीक्षा का सामना करने के सात छोटे कदम।", "Sleep wind-down": "नींद की तैयारी", "A week of gentle habits for an easier night. Not a treatment for sleep problems.": "आसान रात के लिए एक हफ़्ते की कोमल आदतें। नींद की समस्या का इलाज नहीं।",
    "Gentle start": "कोमल शुरुआत", "The basics of handling anxious moments, one tool a day.": "चिंता भरे पलों को संभालने की बुनियादी बातें, रोज़ एक तरीका।",
    "Continue": "जारी रखें", "Review": "दोबारा देखें", "Back to programs": "कार्यक्रमों पर वापस", "Next step": "अगला कदम", "Mark done": "पूरा हुआ", "Undo": "वापस करें", "Journal prompt": "डायरी का सुझाव",
    "Open journal": "डायरी खोलें", "Open focus timer": "फ़ोकस टाइमर खोलें", "Open help page": "मदद पेज खोलें", "Open safety plan": "सुरक्षा योजना खोलें", "Set a reminder": "रिमाइंडर लगाएँ", "Coherence breathing": "समानता साँस",
    "These are gentle self-care routines, not treatment. If things feel too heavy, the Help page lists people you can call.": "ये कोमल आत्म-देखभाल के तरीके हैं, इलाज नहीं। अगर सब बहुत भारी लगे, तो मदद पेज पर उन लोगों की सूची है जिन्हें आप फ़ोन कर सकते हैं।",
    "If sleep trouble lasts for weeks, please talk to a doctor.": "अगर नींद की परेशानी हफ़्तों चले, तो कृपया डॉक्टर से बात करें।",
    "Focus timer": "फ़ोकस टाइमर", "Work in short blocks, rest in between.": "छोटे हिस्सों में काम करें, बीच में आराम करें।", "15 min": "15 मिनट", "25 min": "25 मिनट", "50 min": "50 मिनट", "Focus": "फ़ोकस", "Break": "ब्रेक",
    "Take a breathing break": "साँस का ब्रेक लें", "Focus sessions finished today:": "आज पूरे हुए फ़ोकस सेशन:", "Exam countdown": "परीक्षा की उलटी गिनती", "Add your next exam to see how many days are left.": "अपनी अगली परीक्षा जोड़ें और देखें कितने दिन बचे हैं।",
    "Exam name": "परीक्षा का नाम", "Date": "तारीख", "Save": "सहेजें", "Remove": "हटाएँ", "Tip: the Exam calm program pairs well with this.": "सुझाव: 'परीक्षा में शांति' कार्यक्रम इसके साथ अच्छा चलता है।",
    "My safety plan": "मेरी सुरक्षा योजना", "Fill this in while you are feeling okay. It is for harder moments, when it is difficult to think clearly. It also shows on the Help page.": "इसे तब भरें जब आप ठीक महसूस कर रहे हों। यह कठिन पलों के लिए है, जब साफ़ सोचना मुश्किल हो। यह मदद पेज पर भी दिखती है।",
    "Signs that things are getting hard for me": "वे संकेत कि मेरे लिए चीज़ें कठिन हो रही हैं", "Things that help me calm down": "वे बातें जो मुझे शांत करती हैं", "People I can reach out to": "वे लोग जिनसे मैं संपर्क कर सकता/सकती हूँ", "A place where I feel safe": "वह जगह जहाँ मैं सुरक्षित महसूस करता/करती हूँ", "What matters to me": "मेरे लिए क्या मायने रखता है",
    "Saved on this device as you type.": "लिखते ही इस डिवाइस पर सहेजा जाता है।", "Edit my plan": "मेरी योजना बदलें", "Signs things are getting hard": "चीज़ें कठिन होने के संकेत", "What helps me calm down": "मुझे क्या शांत करता है", "People I can reach": "जिन लोगों से मैं संपर्क कर सकता/सकती हूँ", "A safe place": "एक सुरक्षित जगह",
    "Daily check-in reminder": "रोज़ का चेक-इन रिमाइंडर", "A gentle nudge at a time you choose. Reminders work while MindEase is open in a browser tab.": "आपके चुने समय पर एक कोमल याद दिलाना। रिमाइंडर तब काम करते हैं जब माइंडईज़ ब्राउज़र टैब में खुला हो।",
    "Remind me daily": "रोज़ याद दिलाएँ", "at": "समय", "Send a test reminder": "टेस्ट रिमाइंडर भेजें", "Email reminders need accounts and a server, so they are not part of this version yet.": "ईमेल रिमाइंडर के लिए अकाउंट और सर्वर चाहिए, इसलिए वे अभी इस संस्करण में नहीं हैं।",
    "Display and language": "डिस्प्ले और भाषा", "Sky colors": "आसमान के रंग", "Follow my mood": "मेरे मूड के साथ बदलें", "Teal night": "हरी-नीली रात", "Ember": "अंगारा", "Violet": "बैंगनी", "Midnight blue": "गहरा नीला", "Amber": "सुनहरा",
    "Text size": "अक्षरों का आकार", "Normal": "सामान्य", "Large": "बड़ा", "Extra large": "बहुत बड़ा", "High contrast": "ज़्यादा कंट्रास्ट", "Reduce motion and sparkles": "हलचल और चमक कम करें", "Language": "भाषा",
    "Hindi covers the main screens. Some content, like affirmations and games, stays in English for now.": "हिन्दी मुख्य स्क्रीन को कवर करती है। कुछ सामग्री, जैसे सकारात्मक वाक्य और खेल, अभी अंग्रेज़ी में रहती है।",
    "Check in": "चेक-इन करें",
    /* help */
    "You are not alone": "आप अकेले नहीं हैं", "If things feel like too much right now, reaching out to a person is a brave and good step.": "अगर अभी सब कुछ बहुत ज़्यादा लग रहा है, तो किसी से संपर्क करना एक साहसी और अच्छा कदम है।",
    "In danger right now?": "क्या अभी खतरे में हैं?", "If you or someone near you is in immediate danger, call the emergency number.": "अगर आप या आपके पास कोई तुरंत खतरे में है, तो आपातकालीन नंबर पर फ़ोन करें।", "Call 112 (India)": "112 पर कॉल करें (भारत)",
    "Talk to someone, free": "किसी से बात करें, मुफ़्त", "Tele-MANAS": "टेली-मानस", "is India's free mental health helpline. It is open 24 hours, every day, in around 20 languages.": "भारत की मुफ़्त मानसिक स्वास्थ्य हेल्पलाइन है। यह हर दिन 24 घंटे, लगभग 20 भाषाओं में उपलब्ध है।",
    "Call 14416": "14416 पर कॉल करें", "Outside India": "भारत के बाहर", "Find a free helpline in your country at": "अपने देश की मुफ़्त हेल्पलाइन यहाँ खोजें:",
    "Text someone you trust": "किसी भरोसेमंद को संदेश भेजें", "Sometimes the hardest part is the first sentence. Here is one you can send.": "कभी-कभी सबसे मुश्किल पहला वाक्य होता है। यह एक वाक्य है जो आप भेज सकते हैं।",
    "Hey, I'm having a hard time right now. Can you talk or just stay with me for a bit?": "सुनो, मेरे लिए अभी समय कठिन है। क्या तुम बात कर सकते/सकती हो, या बस थोड़ी देर मेरे साथ रह सकते/सकती हो?", "Copy message": "संदेश कॉपी करें",
    "Something calming, right now": "अभी कुछ शांत करने वाला", "Slow breathing": "धीमी साँस",
    "MindEase is a self-care tool, not medical advice or therapy. Helpline details last checked October 2026, so please confirm on the official site if a call does not connect.": "माइंडईज़ खुद की देखभाल का साधन है, चिकित्सा सलाह या थेरेपी नहीं। हेल्पलाइन की जानकारी अक्टूबर 2026 में जाँची गई थी; कॉल न लगे तो आधिकारिक साइट पर पुष्टि करें।",
    /* account */
    "Welcome back": "वापसी पर स्वागत है", "Create your account": "अपना अकाउंट बनाएँ", "Create account": "अकाउंट बनाएँ", "Email": "ईमेल", "Password": "पासवर्ड", "Name": "नाम", "New here?": "नए हैं?", "Already have an account?": "पहले से अकाउंट है?", "Create an account": "अकाउंट बनाएँ",
    "Sign out": "साइन आउट", "Sync now": "अभी सिंक करें", "Delete account…": "अकाउंट हटाएँ…", "Delete everything": "सब कुछ हटाएँ",
    "Sign in to load your saved check-ins and journal.": "अपने सहेजे चेक-इन और डायरी लोड करने के लिए साइन इन करें।",
    "Save your check-ins, journal and gratitude jar so they follow you. What is already on this device will be added to your account.": "अपने चेक-इन, डायरी और आभार जार सहेजें ताकि वे आपके साथ रहें। इस डिवाइस का मौजूदा डेटा आपके अकाउंट में जुड़ जाएगा।",
    "Signing out removes your data from this device. It stays saved in your account.": "साइन आउट करने पर डेटा इस डिवाइस से हट जाता है। वह आपके अकाउंट में सहेजा रहता है।",
    "Optional": "वैकल्पिक", "Rounds completed:": "पूरे हुए राउंड:"
  };

  var MOOD_HI = { "very happy": "बहुत खुश", "happy": "खुश", "grateful": "आभारी", "calm": "शांत", "neutral": "सामान्य", "tired": "थका हुआ", "sad": "उदास", "anxious": "चिंतित", "overwhelmed": "बोझिल", "angry": "गुस्से में" };
  var ENERGY_HI = { drained: "थका-हारा", low: "कम", okay: "ठीक-ठाक", good: "अच्छी", buzzing: "जोश में" };

  // sentences with numbers or names in them
  var RULES = [
    [/^Good (morning|afternoon|evening|night), (.+)$/, function (m) { return ({ morning: "सुप्रभात", afternoon: "नमस्कार", evening: "शुभ संध्या", night: "शुभ रात्रि" })[m[1]] + ", " + m[2]; }],
    [/^(\d+) of 10, (\w+)$/, function (m) { return m[1] + " / 10, " + (ENERGY_HI[m[2]] || m[2]); }],
    [/^Energy (\d+) of 10 · (.+)$/, function (m) { return "ऊर्जा " + m[1] + " / 10 · " + (D[m[2]] || m[2]); }],
    [/^Rounds completed: (\d+)$/, function (m) { return "पूरे हुए राउंड: " + m[1]; }],
    [/^Moves: (\d+)$/, function (m) { return "चालें: " + m[1]; }],
    [/^(\d+) of 7 days done$/, function (m) { return "7 में से " + m[1] + " दिन पूरे"; }],
    [/^(\d+) days? to (.+)$/, function (m) { return m[2] + " में " + m[1] + " दिन"; }],
    [/^You checked in on (\d+) of 7 days \((\d+) check-ins?\)\.$/, function (m) { return "आपने 7 में से " + m[1] + " दिन चेक-इन किया (" + m[2] + " चेक-इन)।"; }],
    [/^Most common feeling: (.+)\.$/, function (m) { return "सबसे आम एहसास: " + (D[m[1]] || m[1]) + "।"; }],
    [/^Overall your week felt (bright|steady|mixed|heavy)\.$/, function (m) { return "कुल मिलाकर आपका हफ़्ता " + { bright: "उजला", steady: "स्थिर", mixed: "मिला-जुला", heavy: "भारी" }[m[1]] + " रहा।"; }],
    [/^Most tagged: (.+)\.$/, function (m) { return "सबसे ज़्यादा टैग: " + (D[m[1]] || m[1]) + "।"; }],
    [/^Easiest day: (\w+)\. Hardest day: (\w+)\.$/, function (m) { var d = { Sunday: "रविवार", Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार", Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार" }; return "सबसे आसान दिन: " + d[m[1]] + "। सबसे कठिन दिन: " + d[m[2]] + "।"; }],
    [/^(.+) · ([\d-]+)$/, function (m) { return (D[m[1]] || m[1]) + ' · ' + m[2]; }],
    [/^(\d+) words?$/, function (m) { return m[1] + " शब्द"; }],
    [/^(.+) \((\d+) check-ins?, about ([\d.]+) (higher|lower)\)$/, function (m) { return (D[m[1]] || m[1]) + " (" + m[2] + " चेक-इन, लगभग " + m[3] + (m[4] === "higher" ? " ऊपर" : " नीचे") + ")"; }],
    [/^(\d+) good things in your jar$/, function (m) { return "आपके जार में " + m[1] + " अच्छी बातें"; }],
    [/^(Mo, feeling) (.+)$/, function (m) { return "मो, " + (MOOD_HI[m[2]] || m[2]) + " महसूस कर रहा है"; }],
    [/^It is past (\d\d:\d\d) and you have not checked in yet today\.$/, function (m) { return "अब " + m[1] + " बज चुके हैं और आपने आज अभी चेक-इन नहीं किया।"; }],
    [/^Reminder set for (\d\d:\d\d)$/, function (m) { return "रिमाइंडर " + m[1] + " पर लगाया गया"; }]
  ];

  var PLACE = { "What's on your mind? You can leave this empty.": "मन में क्या है? आप इसे खाली भी छोड़ सकते हैं।", "Write as much or as little as you like. Only you can see this.": "जितना चाहें उतना लिखें। इसे सिर्फ़ आप देख सकते हैं।", "Search words…": "शब्द खोजें…", "Name": "नाम", "Phone": "फ़ोन", "e.g. Semester exam": "जैसे सेमेस्टर परीक्षा", "Soft light through the trees": "पेड़ों से छनती नरम रोशनी", "Gentle waves, birdsong": "हल्की लहरें, चिड़ियों का गीत", "Warm sun, a cool breeze": "गुनगुनी धूप, ठंडी हवा", "For example: Harbor": "जैसे: बंदरगाह", "Your password": "आपका पासवर्ड" };

  function tr(s) {
    var key = s.replace(/\s+/g, ' ').trim().replace(/[\u2018\u2019]/g, "'");
    if (!key) return s;
    var out = Object.prototype.hasOwnProperty.call(D, key) ? D[key] : null;
    if (out === null) { for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(key); if (m) { out = RULES[i][1](m); break; } } }
    if (out === null) return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    return lead + out + trail;
  }
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TITLE: 1, CODE: 1 };
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    fixAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (!(n.parentNode && SKIP[n.parentNode.tagName])) fixText(n); } else fixAttrs(n);
    }
  }
  function fixText(n) { var v = n.nodeValue, t = tr(v); if (t !== v) n.nodeValue = t; }
  function fixAttrs(el) {
    var ph = el.getAttribute && el.getAttribute('placeholder');
    if (ph && PLACE[ph]) el.setAttribute('placeholder', PLACE[ph]);
    ['aria-label', 'title'].forEach(function (a) {
      var v = el.getAttribute && el.getAttribute(a);
      if (v) { var t = tr(v); if (t !== v) el.setAttribute(a, t); }
    });
  }

  function start() {
    walk(document.body);
    var tm = document.getElementById('trustMsg'); if (tm) tm.value = D["Hey, I'm having a hard time right now. Can you talk or just stay with me for a bit?"];
    if (document.title) document.title = document.title.replace('MindEase', 'माइंडईज़');
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === 'characterData') fixText(m.target);
        else if (m.type === 'attributes') fixAttrs(m.target);
        else m.addedNodes.forEach(function (x) { walk(x); });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
  }
  window.MI = window.MI || {};
  window.MI.i18n = { tr: tr };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
