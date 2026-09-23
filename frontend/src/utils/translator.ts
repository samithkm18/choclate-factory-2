import i18n from '../i18n';

// Dictionary maps for dynamic product strings across languages
const productTranslations: Record<string, Record<string, { name?: string; description?: string; category?: string }>> = {
  kn: {
    'Venezuelan Criollo Dark Bar': {
      name: 'ವೆನೆಜುವೆಲನ್ ಕ್ರಿಯೋಲೋ ಡಾರ್ಕ್ ಬಾರ್',
      description: '೭೫% ಸಿಂಗಲ್-ಆರಿಜಿನ್ ಕೋಕೋ ವಿತ್ ೨೪ಕೆ ವೆನೆಜುವೆಲನ್ ಗೋಲ್ಡ್ ಫ್ಲೇಕ್ಸ್.',
      category: 'ಡಾರ್ಕ್ ಚಾಕೊಲೇಟ್'
    },
    'Royal Golden Pistachio Truffles': {
      name: 'ರಾಯಲ್ ಗೋಲ್ಡನ್ ಪಿಸ್ತಾ ಟ್ರಫಲ್ಸ್',
      description: 'ಇರಾನಿಯನ್ ಪಿಸ್ತಾ ಪೇಸ್ಟ್ ಮತ್ತು ಬಿಳಿ ಚಾಕೊಲೇಟ್ ತುಂಬಿದ ಕರಕುಶಲ ಚಾಕೊಲೇಟ್.',
      category: 'ಮಿಲ್ಕ್ ಚಾಕೊಲೇಟ್'
    },
    'Symphony Milk Chocolate Bar': {
      name: 'ಸಿಂಫನಿ ಮಿಲ್ಕ್ ಚಾಕೊಲೇಟ್ ಬಾರ್',
      description: 'ಕೆನೆ ಹಾಲಿನೊಂದಿಗೆ ತಯಾರಿಸಿದ ಮೃದುವಾದ ಪ್ರೀಮಿಯಂ ಚಾಕೊಲೇಟ್.',
      category: 'ಮಿಲ್ಕ್ ಚಾಕೊಲೇಟ್'
    },
    'Raspberry Floral Infusion Bar': {
      name: 'ರಾಸ್‌ಬೆರ್ರಿ ಫ್ಲೋರಲ್ ಇನ್ಫ್ಯೂಷನ್ ಬಾರ್',
      description: 'ನೈಸರ್ಗಿಕ ರಾಸ್‌ಬೆರ್ರಿ ಮತ್ತು ಹೂವಿನ ಸಾರದಿಂದ ಕೂಡಿದ ವೈಟ್ ಚಾಕೊಲೇಟ್.',
      category: 'ವೈಟ್ ಚಾಕೊಲೇಟ್'
    },
    'Botanical Herb Infused Reserve': {
      name: 'ಬೊಟಾನಿಕಲ್ ಹರ್ಬ್ ಇನ್ಫ್ಯೂಸ್ಡ್ ರಿಸರ್ವ್',
      description: 'ವಿಶೇಷ ಸಾಂಬಾರ ಜಿನಸಿಗಳು ಮತ್ತು ಸಸ್ಯಗಳ ನೈಸರ್ಗಿಕ ಸಾರ ಹೊಂದಿರುವ ಚಾಕೊಲೇಟ್.',
      category: 'ಬೊಟಾನಿಕಲ್ ಚಾಕೊಲೇಟ್'
    },
    'Custom Happiness Box': {
      name: 'ಕಸ್ಟಮ್ ಹ್ಯಾಪಿನೆಸ್ ಬಾಕ್ಸ್',
      description: 'ನಿಮ್ಮಿಷ್ಟದ ಶ್ರೇಷ್ಠ ಚಾಕೊಲೇಟ್‌ಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಬಾಕ್ಸ್ ವಿನ್ಯಾಸಗೊಳಿಸಿ.',
      category: 'ಕಸ್ಟಮ್ ಬಾಕ್ಸ್'
    }
  },
  hi: {
    'Venezuelan Criollo Dark Bar': {
      name: 'वेनेज़ुएला क्रियोलो डार्क बार',
      description: '७५% सिंगल-ओरिजिन कोको और २४ कैरेट सोने की पत्ती।',
      category: 'डार्क चॉकलेट'
    },
    'Royal Golden Pistachio Truffles': {
      name: 'रॉयल गोल्डन पिस्ता ट्रफल्स',
      description: 'ईरानी पिस्ता पेस्ट और सफेद चॉकलेट से निर्मित हैंडक्राफ्ट ट्रफल्स।',
      category: 'मिल्क चॉकलेट'
    },
    'Symphony Milk Chocolate Bar': {
      name: 'सिम्फनी मिल्क चॉकलेट बार',
      description: 'क्रीमी दूध और प्राकृतिक कोको से बनी मखमली चॉकलेट।',
      category: 'मिल्क चॉकलेट'
    },
    'Raspberry Floral Infusion Bar': {
      name: 'रास्पबेरी फ्लोरल इन्फ्यूजन बार',
      description: 'प्राकृतिक रास्पबेरी और फूलों के अर्क से युक्त वाइट चॉकलेट।',
      category: 'व्हाइट चॉकलेट'
    },
    'Botanical Herb Infused Reserve': {
      name: 'बॉटनिकल हर्ब इन्फ्यूज्ड रिज़र्व',
      description: 'दुर्लभ जड़ी-बूटियों और प्राकृतिक स्वादों का अनूठा मिश्रण।',
      category: 'बॉटनिकल चॉकलेट'
    },
    'Custom Happiness Box': {
      name: 'कस्टम हैप्पीनेस बॉक्स',
      description: 'अपनी पसंद के अनुसार चॉकलेट बॉक्स डिज़ाइन करें।',
      category: 'कस्टम बॉक्स'
    }
  },
  ta: {
    'Venezuelan Criollo Dark Bar': {
      name: 'வெனிசுலான் கிரியோலோ டார்க் பார்',
      description: '75% சிங்கிள்-ஆரிஜின் கோகோ மற்றும் 24k தங்க இலைகள்.',
      category: 'டார்க் சாக்லேட்'
    },
    'Royal Golden Pistachio Truffles': {
      name: 'ராயல் கோல்டன் பிஸ்தா ட்ரஃபிள்ஸ்',
      description: 'பிஸ்தா பேஸ்ட் மற்றும் வெள்ளை சாக்லேட் கலந்த கைவினை சாக்லேட்.',
      category: 'மில்க் சாக்லேட்'
    }
  },
  te: {
    'Venezuelan Criollo Dark Bar': {
      name: 'వెనిజులా క్రియోలో డార్క్ బార్',
      description: '75% సింగిల్-ఆరిజిన్ కోకో మరియు 24k బంగారు పూత.',
      category: 'డార్క్ చాక్లెట్'
    },
    'Royal Golden Pistachio Truffles': {
      name: 'రాయల్ గోల్డెన్ పిస్తా ట్రఫుల్స్',
      description: 'పిస్తా పేస్ట్ మరియు వైట్ చాక్లెట్‌తో చేసిన హస్తకళా చాక్లెట్.',
      category: 'మిల్క్ చాక్లెట్'
    }
  }
};

export function getTranslatedProductName(name: string, currentLang?: string): string {
  const lang = currentLang || i18n.language || 'en';
  if (lang === 'en') return name;
  return productTranslations[lang]?.[name]?.name || name;
}

export function getTranslatedProductDesc(desc: string, name?: string, currentLang?: string): string {
  const lang = currentLang || i18n.language || 'en';
  if (lang === 'en') return desc;
  if (name && productTranslations[lang]?.[name]?.description) {
    return productTranslations[lang][name].description!;
  }
  return desc;
}

export function getTranslatedCategory(category: string, currentLang?: string): string {
  const lang = currentLang || i18n.language || 'en';
  if (lang === 'en') return category;
  
  const catKeyMap: Record<string, string> = {
    'Dark Chocolate': 'shop.categories.dark',
    'Milk Chocolate': 'shop.categories.milk',
    'White Chocolate': 'shop.categories.white',
    'Botanical Chocolate': 'shop.categories.botanical'
  };

  if (catKeyMap[category]) {
    return i18n.t(catKeyMap[category]);
  }
  return category;
}
