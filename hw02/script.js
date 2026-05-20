let products = [
    { id: 1, name: "Помідори", quantity: 2, bought: true },
    { id: 2, name: "Печиво", quantity: 2, bought: false },
    { id: 3, name: "Сир", quantity: 1, bought: false }
];

const productInput = document.getElementById('product-input');
const btnAdd = document.getElementById('btn-add');
const itemsList = document.getElementById('items-list');
const leftTags = document.getElementById('left-tags');
const boughtTags = document.getElementById('bought-tags');

function render() {
    itemsList.innerHTML = '';
    leftTags.innerHTML = '';
    boughtTags.innerHTML = '';

    products.forEach(product => {
        const productRow = document.createElement('div');
        productRow.className = 'product-row';

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
            const minusClass = product.quantity === 1 ? 'btn-minus-light' : 'btn-minus';
            
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

        itemsList.appendChild(productRow);

        const tag = document.createElement('span');
        tag.className = product.bought ? 'tag strike' : 'tag';
        tag.innerHTML = `${product.name} <span class="tag-num">${product.quantity}</span>`;

        if (product.bought) {
            boughtTags.appendChild(tag);
        } else {
            leftTags.appendChild(tag);
        }
    });
}

function addProduct() {
    const name = productInput.value.trim();
    
    if (name === '') return;

    const newProduct = {
        id: Date.now(), 
        name: name,
        quantity: 1,
        bought: false
    };

    products.push(newProduct);
    
    productInput.value = '';
    productInput.focus();

    render();
}

btnAdd.addEventListener('click', addProduct);
productInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addProduct();
    }
});

itemsList.addEventListener('click', (e) => {
    const target = e.target;
    const id = parseInt(target.getAttribute('data-id'));
    
    if (!id) return; 

    const product = products.find(p => p.id === id);

    if (target.classList.contains('btn-plus')) {
        product.quantity++;
        render();
    }

    if (target.classList.contains('btn-minus') || target.classList.contains('btn-minus-light')) {
        if (product.quantity > 1) {
            product.quantity--;
            render();
        }
    }

    if (target.classList.contains('btn-status')) {
        product.bought = !product.bought;
        render();
    }

    if (target.classList.contains('btn-danger')) {
        products = products.filter(p => p.id !== id);
        render();
    }
});

itemsList.addEventListener('click', (e) => {
    const target = e.target;
    
    if (target.classList.contains('product-name') && !target.classList.contains('bought')) {
        const id = parseInt(target.getAttribute('data-id'));
        const product = products.find(p => p.id === id);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = product.name;
        input.className = 'edit-input'; 

        target.replaceWith(input);
        input.focus();

        const saveChanges = () => {
            const newName = input.value.trim();
            if (newName !== '') {
                product.name = newName;
            }
            render(); 
        };

        input.addEventListener('blur', saveChanges);

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveChanges();
            }
        });
    }
});

render();