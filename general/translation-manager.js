/**
 * Shared Translation Manager
 * Handles language switching, auto-detection, and persistence.
 * 
 * @param {Object} translations - The dictionary of translations (e.g., { en: {...}, vi: {...} })
 * @param {String} storageKey - The localStorage key to save the user's language preference
 */
function initTranslationSystem(translations, storageKey) {
    function switchLanguage(lang) {
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (translations[lang] && translations[lang][key]) {
                element.innerHTML = translations[lang][key];
            }
        });

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }
        });

        document.documentElement.lang = lang;
        localStorage.setItem(storageKey, lang);
    }

    document.querySelectorAll('.lang-btn').forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            switchLanguage(lang);
        });
    });

    // Auto-detect language
    const detectUserLanguage = () => {
        const savedLang = localStorage.getItem(storageKey);
        if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
            return savedLang;
        }

        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang && browserLang.toLowerCase().startsWith('vi')) {
            return 'vi';
        }

        return 'en';
    };

    // Initialize with detected language
    const initialLang = detectUserLanguage();
    switchLanguage(initialLang);
}
