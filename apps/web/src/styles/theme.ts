import { ThemeConfig } from 'antd';

// Light theme configuration
export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorLink: '#1677ff',

    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Fonts
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,

    // Colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgSpotlight: '#ffffff',

    colorText: 'rgba(0, 0, 0, 0.85)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

    // Border
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // Shadow
    boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
    boxShadowSecondary: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',

    // Layout
    headerHeight: 64,
    siderWidth: 256,
    siderCollapsedWidth: 80,
    footerHeight: 48,

    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
    motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
    motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
    motionEaseInOutBack: 'cubic-bezier(0.71, -0.46, 0.29, 1.46)',
    motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
    motionEaseInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: '#1677ff',
      itemHoverBg: '#f5f5f5',
    },
    Button: {
      controlOutline: 'rgba(24, 144, 255, 0.2)',
      controlOutlineWidth: 2,
    },
    Input: {
      controlOutline: 'rgba(24, 144, 255, 0.2)',
      controlOutlineWidth: 2,
    },
    Table: {
      headerBg: '#fafafa',
      headerBorderRadius: 0,
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
};

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  ...lightTheme,
  algorithm: 'dark', // This would be theme.darkAlgorithm in real Ant Design

  token: {
    ...lightTheme.token,
    colorPrimary: '#1677ff',

    // Colors for dark mode
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#000000',
    colorBgSpotlight: '#424242',

    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

    colorBorder: '#434343',
    colorBorderSecondary: '#303030',

    // Shadow for dark mode
    boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.48), 0 3px 6px 0 rgba(0, 0, 0, 0.36), 0 5px 12px 4px rgba(0, 0, 0, 0.27)',
    boxShadowSecondary: '0 3px 6px -4px rgba(0, 0, 0, 0.48), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.2)',
  },
  components: {
    ...lightTheme.components,
    Layout: {
      siderBg: '#1f1f1f',
      headerBg: '#1f1f1f',
      bodyBg: '#000000',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#111b26',
      itemSelectedColor: '#1677ff',
      itemHoverBg: '#262626',
    },
    Table: {
      headerBg: '#1f1f1f',
      headerBorderRadius: 0,
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
};

// Compact theme configuration
export const compactTheme: ThemeConfig = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,

    padding: 12,
    paddingLG: 16,
    paddingSM: 8,

    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
  },
};

export type ThemeMode = 'light' | 'dark' | 'compact';

export const getThemeConfig = (mode: ThemeMode): ThemeConfig => {
  switch (mode) {
    case 'dark':
      return darkTheme;
    case 'compact':
      return compactTheme;
    default:
      return lightTheme;
  }
};