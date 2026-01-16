import 'vue';

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string) => string;
    $i18n: {
      locale: {
        value: string;
      };
    };
  }
}
