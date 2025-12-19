import 'i18next';
import tr from '../../public/locales/tr/translation.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: typeof tr;
        };
    }
}
