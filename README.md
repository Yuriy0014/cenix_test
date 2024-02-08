[![**Puppeteer** Logo](https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png)](https://pptr.dev/)

Тестовое задание на Puppeteer


## Технологии
![Puppeteer Badge](https://img.shields.io/badge/Puppeteer-40B5A4?logo=puppeteer&logoColor=fff&style=flat)

![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff&style=flat)
![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=flat)


![ESLint Badge](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=fff&style=flat)




## Описание
* Сам код написан на TypeScript и находится по пути **src/index.ts**
* Результат тестового по пути **dist/index.js**. Скриншот и информация о продукте будут сохранены в соответствующую региону папку в **results**
* Для массового парсинга имена файлов изменил для удобства.
Вместо screenshot и product имена это **url продукта + область + текущая дата** 
* Пример 
  * chaykofskiy-chaykofskiy-sahar-pesok-krist-900g-Рязанская-обл.-2024-02-08T21-57-46-366Z.jpg
  * chaykofskiy-chaykofskiy-sahar-pesok-krist-900g-Рязанская-обл.-2024-02-08T21-57-46-366Z.txt
* Для парсинга всех страниц по всем регионам написал отдельный файлик, чтобы не запускать скрипт для каждой ссылки и региона вручную - **startup.js**
  * запускать из папки dist. Парсинг выполняется последовательно т.к. в тз не стояла задача сделать параллельный парсинг нескольких страниц :)
* Результаты парсинга находятся в архиве **result.zip**. Разложены по папкам-регионам и находятся в отдельных папках для скринов и для данных
* В качестве линтера использовал [standard-with-typescript](https://www.npmjs.com/package/eslint-config-standard-with-typescript)

Пример команды для запуска из папки **dist**
```bash
node index.js https://www.vprok.ru/product/ritter-sport-rit-sport-shokol-tsel-les-oreh-mol-100g--305088 "Рязанская обл."
```