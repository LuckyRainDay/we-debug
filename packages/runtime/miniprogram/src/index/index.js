import Debug from '@we-debug/core';

const store = Debug.store;

Component({
  options: {
    multipleSlots: true
  },
  properties: {
    config: {
      type: Object,
      value: {}
    }
  },
  observers: {
    'config.rules'(v) {
      if (v) {
        this.setData({ rules: v });
      }
    },
    'config.badges'(v) {
      if (v) {
        this.setData({ badges: v });
      }
    },
    'config.modal'(v) {
      if (v) {
        this.setData({ modal: v });
      }
    }
  },
  data: {
    sys: store.sys.get(),
    rules: store.rules.get(),
    badges: store.badges.get(),
    modal: {
      logo: './logo.png',
      scrollHeight: 500
    }
  },
  methods: {
    setSys() {
      this.setData({ sys: store.sys.get() });
    },
    setRules() {
      this.setData({ rules: store.rules.get() });
    },
    setBadges() {
      this.setData({ badges: store.badges.get() });
    }
  },
  lifetimes: {
    attached() {
      this.setSys();
      this.setRules();
      this.setBadges();
    }
  }
});
