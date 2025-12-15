import React from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from '@/stores';
import { router } from '@/routes';
import { lightTheme, darkTheme } from '@/styles/theme';
import '@/styles/globals.css';
import '@/styles/variables.css';

function App() {
  // Get theme mode from Redux store
  const themeMode = store.getState().ui.theme;
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={theme}
      >
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
}

export default App;