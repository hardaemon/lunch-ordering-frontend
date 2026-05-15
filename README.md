## Установка

Выполните команды:
```
npm install -g expo-cli
cd ПУТЬ_К_ПАПКЕ/корневая_папка_проекта
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npx expo install react-native-screens react-native-safe-area-context expo-secure-store @react-native-community/datetimepicker expo-clipboard expo-linking expo-notifications expo-device expo-haptics
npm install @react-navigation/native @react-navigation/native-stack axios socket.io-client react-native-toast-message react-native-reanimated@~4.1.0 react-native-worklets@0.5.1
npm install babel-preset-expo@~54.0.10 --save-dev
```

Скачайте данные файлы и загрузите их в папку mobile (с заменой файлов)

Создайте в папке mobile файл `.env` по типу:
```
EXPO_PUBLIC_API_URL=http://ВАШ_IP_АДРЕС:3000/api
```

## Запуск

В папке frontend выполните команду `npx expo start`

## Сборка .apk

```
npm install -g eas-cli
eas login
eas build:configure

```