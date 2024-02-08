import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

interface ProductInfo {
  price: number | null
  oldPrice: number | null
  rating: number | null
  reviewCount: number
}

// Определение перечисления для регионов
enum Region {
  Moscow = 'Москва и область',
  SPb = 'Санкт-Петербург и область',
  Vladimir = 'Владимирская обл.',
  Kaluga = 'Калужская обл.',
  Ryazan = 'Рязанская обл.',
  Tver = 'Тверская обл.',
  Tula = 'Тульская обл.',
}

// Функция для форматирования даты в строку
function formatDate(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-')
}

// Функция для получения короткого имени товара из URL
function getProductNameFromUrl(url: string): string {
  const urlParts = url.split('/')
  const lastPart = urlParts[urlParts.length - 1]
  const nameMatch = lastPart.match(/[\w-]+(?=--\d+)/)
  return nameMatch != null ? nameMatch[0] : 'product'
}

// Функция для создания задержки
async function delay(time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

async function scrapeProduct(url: string, regionKey: keyof typeof Region): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--start-maximized'], // Запуск браузера в максимизированном окне
  })
  const page = await browser.newPage()

  await page.setViewport({ width: 1920, height: 1080 }) // Установка размера окна браузера

  await page.goto(url)

  // Выбираем регион из списка
  const regionToSelect = Region[regionKey]

  // Проверяем, выбран ли уже нужный регион
  const isRegionSelected = await page.evaluate(regionToSelect => {
    // Используем селектор для поиска элемента, отображающего текущий регион, основываясь на начале его класса
    const regionTextElement = document.querySelector(
      'div[class^="Region_region"] span:not([class^="Region_regionIcon"])'
    )
    // Используем оператор ?. для безопасного обращения к textContent и ?? для предоставления false как значения по умолчанию
    return regionTextElement?.textContent?.trim().includes(regionToSelect) ?? false
  }, regionToSelect)

  if (!isRegionSelected) {
    // Выбор региона на странице

    // Нажимаем на элемент, чтобы открыть список регионов
    await page.click('[class^="Region_region__"]')

    // Ожидаем появления списка регионов
    await page.waitForFunction(() =>
      document.querySelector('[class^="UiRegionListBase_listWrapper__"]')
    )
    await page.evaluate(region => {
      const items = Array.from(document.querySelectorAll('[class^="UiRegionListBase_item__"]'))
      const targetItem = items.find(item => item.textContent?.trim() === region)
      if (targetItem) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error т.к. в браузере есть метод click
        targetItem.click()
      }
    }, regionToSelect)

    await delay(7000)
  }

  await page.waitForSelector('[class^="ProductPage_informationBlock__"]', { timeout: 10000 })

  // Получение короткого имени товара
  const productName = getProductNameFromUrl(url)

  // Преобразование ключа региона в имя папки
  const regionName = regionKey

  // Формирование имени файла для скриншота
  const screenshotPath = `../results/screenshot.jpg`

  // Прокрутка страницы до конца
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })

  // Добавьте задержку, чтобы убедиться, что страница полностью прогрузилась и динамические элементы отобразились
  await delay(1000) // Задержка в миллисекундах

  // Листаем обратно вверх, чтобы хедер не съехал на скрине
  await page.evaluate(() => {
    window.scrollTo(0, 0)
  })
  await delay(3000)

  try {
    // Ожидание и закрытие всплывающего окна с куки
    const cookieSelector = 'div[class^="CookiesAlert_agreeButton__"] button'
    if ((await page.$(cookieSelector)) !== null) {
      await page.click(cookieSelector)
    }

    // Ожидание и закрытие всплывающего окна с подсказкой
    const tooltipSelector = 'button[class^="Tooltip_closeIcon"]'
    if ((await page.$(tooltipSelector)) !== null) {
      await page.click(tooltipSelector)
    }
  } catch (e) {
    console.log('Ошибка при попытке закрыть всплывающие окна:', e)
  }

  // Скриншот страницы
  await page.screenshot({ path: screenshotPath, fullPage: true })

  // Получение данных о товаре
  const productInfo: ProductInfo = await page.evaluate(() => {
    const priceElement = document.querySelector(
      '[class^="ProductPage_informationBlock__"] [class^="PriceInfo_root__"] [class^="Price_price__"]:not([class*="Price_role_old__"])'
    )

    const priceText =
      priceElement?.textContent
        ?.trim()
        .replace(',', '.')
        .replace(/[^0-9.]/g, '') ?? null

    const oldPriceElement = document.querySelector(
      '[class^="ProductPage_informationBlock__"] [class^="PriceInfo_oldPrice__"] [class^="Price_price__"]'
    )
    const oldPriceText =
      oldPriceElement?.textContent
        ?.trim()
        .replace(',', '.')
        .replace(/[^0-9.]/g, '') ?? null

    const ratingElement = document.querySelector(
      '[class^="ProductPage_title__"] [class^="Rating_root__"] [class^="Rating_value__"]'
    )
    const ratingText = ratingElement ? ratingElement?.textContent?.trim() : 0

    const reviewCountElement = document.querySelector(
      '[class^="ProductPage_title__"] [class^="ActionsRow_reviews__"]'
    )
    const reviewCountText = reviewCountElement?.textContent?.trim() ?? ''

    // Преобразование извлеченных строк в числа
    const price = priceText ? parseFloat(priceText) : null
    const oldPrice = oldPriceText ? parseFloat(oldPriceText) : null
    const rating = ratingText ? parseFloat(ratingText) : null
    const reviewCount = parseInt(reviewCountText.replace(/\D/g, ''), 10) || 0

    return { price, oldPrice, rating, reviewCount }
  })

  // Формирование имени файла для информации о товаре
  const productFilePath = `../results/product.txt`

  // Сохранение информации о товаре в файл
  writeFileSync(productFilePath, JSON.stringify(productInfo), 'utf-8')

  await browser.close()
}

// Аргументы должны быть переданы в скрипт
const args = process.argv.slice(2)
const [url, regionArg] = args

// Проверяем, является ли переданный регион допустимым ключом перечисления Region
const regionKey = Object.keys(Region).find(key => Region[key as keyof typeof Region] === regionArg)

if (regionKey == null) {
  throw new Error(`Invalid region: ${regionArg}`)
}

scrapeProduct(url, regionKey as keyof typeof Region).catch(console.error)
