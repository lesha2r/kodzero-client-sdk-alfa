# Kodzero SDK

Kodzero SDK — это официальный JavaScript/TypeScript-пакет для быстрой и безопасной работы с вашим проектом на Kodzero. Он упрощает интеграцию, избавляет от рутины ручных запросов и обеспечивает строгую типизацию, автокомплит и удобную работу с коллекциями и записями.

> Kodzero — это платформа для создания backend с готовым API, базой данных и авторизацией. [Подробнее на сайте](https://kodzero.pro)

Этот README описывает только npm-пакет `kodzero-sdk` (JavaScript/TypeScript клиент).

## Полезные ссылки

- [Полная документация по SDK](https://kodzero.pro/docs/sdk)
- ✨ [Инструкция для ИИ-агентов](https://kodzero.pro/docs/sdk/ai) 
- [kodzero-sdk на GitHub](https://github.com/kodzeropro/kodzero-sdk)
- [Подробнее о Kodzero](https://kodzero.pro)

## Установка

```bash
npm i kodzero-sdk
```

## Быстрый старт

```ts
import Kodzero from 'kodzero-sdk'

const kodzero = new Kodzero({
  host: 'https://api.kodzero.pro/v1/<PROJECT_ID>',
  authCollection: '<AUTH_COLLECTION_ID>' // optional, но нужен для auth-модуля
})
```

Где:

- `host` — URL вашего проекта в Kodzero API.
- `authCollection` — ID коллекции пользователей для методов авторизации.

Подробная инструкция: https://kodzero.pro/docs/sdk/start

## ✨ Использование SDK с ИИ-агентом

`kodzero-sdk` оптимизирован для работы с ИИ-агентами. Просто добавьте подготовленную нами инструкцию в контекст ChatGPT, Claude, Cursor, Windsurf или другого ИИ — и он сможет эффективно использовать SDK при разработке. 

[Открыть инструкцию для ИИ-агентов →](https://kodzero.pro/docs/sdk/ai)

## Авторизация

SDK содержит встроенный auth-модуль и управление токенами.

Для работы со стратегиями `auth` укажите `authCollection` при инициализации SDK. На текущий момент основная рабочая стратегия в SDK — `password` (email + password).

Доступные сценарии:

- вход пользователя;
- регистрация;
- проверка токена (`verify`);
- обновление токена (`refresh`);
- выход (`logout`).

Пример:

```ts
const credentials = {
  email: 'user@example.com',
  password: 'StrongPassword123'
}

await kodzero.auth.email.login(credentials)
```

[Подробно об авторизации в SDK](https://kodzero.pro/docs/sdk/auth)

## Работа с данными (модели)

`kodzero-sdk` предоставляет модельный подход (Active Record style) для коллекций: вы создаете модель и работаете с записями через экземпляры и статические методы.

### 1. Создание модели

```ts
interface Product {
  _id: string | null
  title: string
  price: number
  sku: string
  status?: 'draft' | 'active' | 'archived'
}

const Product = kodzero.createModel<Product>({
  collection: 'products'
})
```

### 2. Работа с экземпляром модели

Экземпляр удобен для сценариев «создать → изменить → сохранить».

```ts
const product = new Product({
  _id: null,
  title: 'Беспроводные наушники',
  sku: 'WH-1000XM5',
  price: 29990,
  status: 'draft'
})

console.log(product.data())
```

#### `save()` для create/update

```ts
// Создание новой записи
await product.save()

// Локально меняем поле
product.set('price', 27990)

// Сохраняем изменения
await product.save()
```

#### `delete()`

```ts
await product.delete() // удаление
```

#### validate()
Валидирует данные по схеме (если схема была указана при создании модели):

```ts
const result = product.validate()

if (result.ok) {
  console.log('Данные корректны')
} else {
  console.log('Ошибки:', result.joinErrors())
}
```

### 3. Статические методы модели

Статические методы полезны для получения и массовой выборки данных без создания экземпляров.

#### `get(id)` и `find(id)`

```ts
// Возвращает экземпляр модели (с методами экземпляра)
const productModel = await Product.get('product_id')
productModel.set('status', 'active')
await productModel.save()

// Возвращает plain-object с данными
const productData = await Product.find('product_id')
console.log(productData.title)
```

#### `findMany(options)` с фильтрами

```ts
const products = await Product.findMany({
  page: 1,
  perPage: 20,
  search: 'наушники',
  sort: '-createdAt',
  fields: ['title', 'price', 'status']
})

console.log(products.length)
```

#### `findManyPaginated(options, page, perPage)`

Получает список документов с информацией о пагинации, а также позволяет работать со страницами через встроенные методы (`next()` и `previous()`).

[Подробно о пагинации](https://kodzero.pro/docs/sdk/pagination)

```ts
const paginated = await Product.findManyPaginated(
  { status: 'active' },
  1,
  25
)

console.log(paginated.data)
console.log(paginated.state.page)
console.log(paginated.state.total)

await paginated.next()
console.log(paginated.state.page) // 2
```

#### Статические `create`, `update`, `delete`

```ts
const created = await Product.create({
  title: 'Умная колонка',
  sku: 'SMART-SPEAKER-01',
  price: 12990
})

await Product.update(created._id, {
  status: 'active'
})

await Product.delete(created._id)
```

[Подробнее о статических методах](https://kodzero.pro/docs/sdk/model#%D1%81%D1%82%D0%B0%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5-%D0%BC%D0%B5%D1%82%D0%BE%D0%B4%D1%8B)

### 4. Кастомные методы модели

Кастомные методы помогают держать бизнес-логику рядом с данными.

#### Регистрация метода

```ts
interface Invoice {
  _id: string | null
  number: string
  total: number
  status: 'draft' | 'sent' | 'paid'
  paidAt?: string | null
}

interface InvoiceMethods {
  markAsPaid: () => Promise<void>
  getSummary: () => string
  canBePaid: () => boolean
}

const Invoice = kodzero.createModel<Invoice, InvoiceMethods>({
  collection: 'invoices'
})

Invoice.registerMethod('canBePaid', function() {
  return this.data().status === 'sent'
})

Invoice.registerMethod('markAsPaid', async function() {
  if (!this.canBePaid()) {
    throw new Error('Invoice cannot be paid in current status')
  }

  this.set('status', 'paid')
  this.set('paidAt', new Date().toISOString())
  await this.update()
})

Invoice.registerMethod('getSummary', function() {
  const data = this.data()
  return `Счёт ${data.number}: ${data.total} ₽ (${data.status})`
})
```

#### Использование кастомных методов

```ts
const invoice = await Invoice.get('invoice_id')

if (invoice.canBePaid()) {
  await invoice.markAsPaid()
}

console.log(invoice.getSummary())
```

[Документация по кастомным методам](https://kodzero.pro/docs/sdk/custom)

### 5. Валидация данных модели

SDK поддерживает валидацию при помощи npm-пакета [Validno](https://www.npmjs.com/package/validno).

```ts
const productSchema = {
  _id: { type: String, required: false },
  title: { type: String },
  sku: { type: String },
  price: { type: Number },
  status: { type: String, required: false }
}

const Product = kodzero.createModel<Product>({
  collection: 'products',
  schema: productSchema
})
```

#### Пример: Валидация перед сохранением

```ts
const candidate = new Product({
  _id: null,
  title: 'Монитор 34"',
  sku: 'MON-34-4K',
  price: 49990
})

const validation = candidate.validate()

if (!validation.ok) {
  console.error(validation.errors)
  console.error(validation.joinErrors())
} else {
  await candidate.save()
}
```

[Подробнее о валидации](https://kodzero.pro/docs/sdk/validation)

## Рекомендация

Для детальной работы с SDK используйте развернутую документацию с примерами, описанием методов, типизацией, сценариями авторизации и практиками обработки ошибок:

https://kodzero.pro/docs
