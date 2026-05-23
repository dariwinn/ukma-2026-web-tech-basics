/* початковий масив із дефолтними товарами */
let products = [
    { id: 1, name: "Помідори", quantity: 2, bought: true },
    { id: 2, name: "Печиво", quantity: 2, bought: false },
    { id: 3, name: "Сир", quantity: 1, bought: false }
];

/* отримання посилань на елементи розмітки */
const productInput = document.getElementById('product-input');
const btnAdd = document.getElementById('btn-add');
const itemsList = document.getElementById('items-list');
const leftTags = document.getElementById('left-tags');
const boughtTags = document.getElementById('bought-tags');

/* головна функція відтворення списку та статистики */
function render() {
    /* очищення контейнерів перед перерендерінгом */
    itemsList.innerHTML = '';
    leftTags.innerHTML = '';
    boughtTags.innerHTML = '';

    /* генерація елементів для кожного товару з масиву */
    products.forEach(product => {
        const productRow = document.createElement('div');
        productRow.className = 'product-row';

        /* рендеринг рядка для купленого товару */
        if (product.bought) {
            productRow.innerHTML = `
                <span class="product-name bought">${product.name}</span> 
                <div class="controls">
                    <div class="quantity-wrapper">
                        <span class="quantity-badge">${product.quantity}</span>
                    </div>
                    <button class="btn-status" data-id="${product.id}" data-tooltip="Повернути у список">Не куплено</button>
                </div>
            `;
        } else {
            /* визначення стилю для кнопки мінус при мінімальній кількості */
            const minusClass = product.quantity === 1 ? 'btn-minus-light' : 'btn-minus';
            
            /* text-first html-структура для некупленого товару */
            productRow.innerHTML = `
                <span class="product-name" data-id="${product.id}">${product.name}</span>
                <div class="controls">
                    <button class="btn-round ${minusClass}" data-id="${product.id}">-</button>
                    <span class="quantity-badge">${product.quantity}</span>
                    <button class="btn-round btn-plus" data-id="${product.id}">+</button>
                    <button class="btn-status" data-id="${product.id}" data-tooltip="Позначити як куплене">Куплено</button>
                    <button class="btn-danger" data-id="${product.id}" data-tooltip="Видалити">×</button>
                </div>
            `;
        }

        /* додавання створеного рядка в загальний список */
        itemsList.appendChild(productRow);

        /* створення плашки-тегу для бічної панелі статистики */
        const tag = document.createElement('span');
        tag.className = product.bought ? 'tag strike' : 'tag';
        tag.innerHTML = `${product.name} <span class="tag-num">${product.quantity}</span>`;

        /* розподіл тегів між блоками куплено та залишилося */
        if (product.bought) {
            boughtTags.appendChild(tag);
        } else {
            leftTags.appendChild(tag);
        }
    });
}

/* функція створення та додавання нового товару */
function addProduct() {
    const name = productInput.value.trim();
    
    if (name === '') return;

    /* формування об'єкта нового товару з унікальним id */
    const newProduct = {
        id: Date.now(), 
        name: name,
        quantity: 1,
        bought: false
    };

    /* додавання об'єкта в масив та оновлення інтерфейсу */
    products.push(newProduct);
    
    /* очищення поля та повернення фокусу на нього */
    productInput.value = '';
    productInput.focus();

    render();
}

/* обробка кліку на кнопку додавання */
btnAdd.addEventListener('click', addProduct);

/* додавання товару при натисканні клавіші enter */
productInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addProduct();
    }
});

/* делегування подій кліку для кнопок керування товаром */
itemsList.addEventListener('click', (e) => {
    const target = e.target;
    const id = parseInt(target.getAttribute('data-id'));
    
    if (!id) return; 

    const product = products.find(p => p.id === id);

    /* збільшення кількості товару на одиницю */
    if (target.classList.contains('btn-plus')) {
        product.quantity++;
        render();
    }

    /* зменшення кількості товару, але не менше одиниці */
    if (target.classList.contains('btn-minus') || target.classList.contains('btn-minus-light')) {
        if (product.quantity > 1) {
            product.quantity--;
            render();
        }
    }

    /* перемикання статусу покупки купленого або некупленого */
    if (target.classList.contains('btn-status')) {
        product.bought = !product.bought;
        render();
    }

    /* повне видалення товару зі списку через фільтрацію */
    if (target.classList.contains('btn-danger')) {
        products = products.filter(p => p.id !== id);
        render();
    }
});

/* обробка кліку на назву товару для його редагування */
itemsList.addEventListener('click', (e) => {
    const target = e.target;
    
    /* відкриття інпуту редагування лише для некуплених товарів */
    if (target.classList.contains('product-name') && !target.classList.contains('bought')) {
        const id = parseInt(target.getAttribute('data-id'));
        const product = products.find(p => p.id === id);

        /* створення та налаштування тимчасового поля вводу */
        const input = document.createElement('input');
        input.type = 'text';
        input.value = product.name;
        input.className = 'edit-input'; 

        /* заміна тексту на інпут та переведення фокусу */
        target.replaceWith(input);
        input.focus();

        /* функція збереження оновленої назви товару */
        const saveChanges = () => {
            const newName = input.value.trim();
            if (newName !== '') {
                product.name = newName;
            }
            render(); 
        };

        /* збереження змін при втраті фокусу з інпуту */
        input.addEventListener('blur', saveChanges);

        /* збереження змін при натисканні enter під час редагування */
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveChanges();
            }
        });
    }
});

render();