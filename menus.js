function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const shippingCost = 5000;
    const productList = document.getElementById("product-list");
    const totalProducts = document.getElementById("total-products");
    const val_t_prodcut = document.getElementById("val_t_prodcut");
    const envioEl = document.getElementById("Envio");
    const totalPrice = document.getElementById("total-price");
    const apiUrl = "https://script.google.com/macros/s/AKfycbyK_dhbSSxREs9_2URso4hbSuodo4AouBzb-rIX5-DrEqi63ni1HH7-391MLbNYgiEO/exec"; // Reemplaza con la URL correcta

    // Cargar productos desde Google Sheets con GET
    async function fetchProducts() {
        try {
            const response = await fetch(apiUrl, {
                method: "GET",
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log("Productos cargados:", data);
            if (data.data) {
                displayProducts(data.data);
            }
        } catch (error) {
            console.error("Error al cargar los productos:", error);
        }
    }

    // Mostrar productos en las secciones correspondientes
    function displayProducts(products) {
        const sections = {
            Entradas: document.getElementById("entradas-container"),
            PlatoFuerte: document.getElementById("platos-container"),
            Bebidas: document.getElementById("bebidas-container"),
            Postre: document.getElementById("postres-container")
        };

        products.forEach(product => {
            console.log("Producto:", product); // Depuración
            const item = document.createElement("div");
            item.classList.add("menu-item");

            const imageUrl = product.imagen && product.imagen.startsWith("http")
                ? product.imagen
                : "https://via.placeholder.com/150";

            item.innerHTML = `
                <img src="${imageUrl}" alt="${product.producto}">
                <h3>${product.producto}</h3>
                <p class="price">$${product.precio}</p>
                <div class="controls">
                    <button class="decrease">-</button>
                    <input type="text" value="1" readonly>
                    <button class="increase">+</button>
                </div>
                <button class="add-to-cart">Agregar</button>
            `;

            if (sections[product.Categorias]) {
                sections[product.Categorias].appendChild(item);
            } else {
                console.warn(`Categoría no encontrada: ${product.Categorias}`);
            }

            const quantityInput = item.querySelector("input");
            item.querySelector(".increase").addEventListener("click", () => {
                quantityInput.value = parseInt(quantityInput.value) + 1;
            });
            item.querySelector(".decrease").addEventListener("click", () => {
                if (parseInt(quantityInput.value) > 1) {
                    quantityInput.value = parseInt(quantityInput.value) - 1;
                }
            });

            item.querySelector(".add-to-cart").addEventListener("click", () => {
                console.log("Botón Agregar clickeado, producto:", product, "cantidad:", quantityInput.value);
                addToCart({ ...product, quantity: parseInt(quantityInput.value) });
            });
        });
    }

    // Agregar productos al carrito
    function addToCart(product) {
        console.log("Añadiendo al carrito:", product);
        // Si no hay id, usa el nombre del producto como identificador
        const identifier = product.id || product.producto;
        const existingProduct = cart.find(item => (item.id || item.producto) === identifier);
        if (existingProduct) {
            existingProduct.quantity += product.quantity;
        } else {
            cart.push(product);
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartDisplay();
    }

    // Actualizar la visualización del carrito
    function updateCartDisplay() {
        if (!productList) return;
        productList.innerHTML = "";
        let total = 0;
        let quantity = 0;

        cart.forEach((item, index) => {
            const itemElement = document.createElement("div");
            itemElement.classList.add("product");
            itemElement.dataset.name = item.producto;
            itemElement.dataset.price = item.precio;

            itemElement.innerHTML = `
                <img src="${item.imagen || 'https://via.placeholder.com/150'}" alt="${item.producto}">
                <p>${item.producto}</p>
                <p>Precio Unitario: $${item.precio.toLocaleString()}</p>
                <div class="controls">
                    <button class="decrease" data-index="${index}">-</button>
                    <input type="text" value="${item.quantity}" readonly>
                    <button class="increase" data-index="${index}">+</button>
                </div>
                <button class="remove" data-index="${index}">Eliminar</button>
            `;
            productList.appendChild(itemElement);

            total += item.precio * item.quantity;
            quantity += item.quantity;
        });

        if (totalProducts) totalProducts.textContent = quantity;
        if (val_t_prodcut) val_t_prodcut.textContent = `$${total.toLocaleString()}`;
        if (envioEl) envioEl.textContent = `$${shippingCost.toLocaleString()}`;
        if (totalPrice) totalPrice.textContent = `$${(total + shippingCost).toLocaleString()}`;
    }

    // Manejar eventos del carrito
    if (productList) {
        productList.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            if (e.target.classList.contains("increase")) {
                cart[index].quantity++;
            } else if (e.target.classList.contains("decrease")) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                } else {
                    cart.splice(index, 1);
                }
            } else if (e.target.classList.contains("remove")) {
                cart.splice(index, 1);
            }
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartDisplay();
        });
    }

    // Limpiar carrito
    document.querySelector(".limpiar_ca")?.addEventListener("click", () => {
        localStorage.removeItem("cart");
        cart.length = 0;
        updateCartDisplay();
    });

    // Finalizar compra con POST
    document.querySelector(".checkout")?.addEventListener("click", async () => {
        const order = {
            nombre: document.getElementById("address").value,
            telefono: document.getElementById("phone").value,
            direccion: document.getElementById("apartment").value,
            productos: cart,
            total: totalPrice.textContent.replace("$", "").replace(",", "")
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.text();
            if (result === "OK") {
                const finalProducts = totalProducts.textContent;
                const finalTotalProduct = val_t_prodcut.textContent;
                const finalEnvio = envioEl.textContent;
                const finalTotalPrice = totalPrice.textContent;

                alert("Su compra ha sido finalizada, en un momento nuestro repartidor llevará su pedido.");
                const cartSummary = document.querySelector(".cart-summary");
                if (cartSummary) {
                    const finalSummary = document.createElement("div");
                    finalSummary.classList.add("final-summary");
                    finalSummary.innerHTML = `
                        <h2>Resumen Final de Compra</h2>
                        <p>Productos: ${finalProducts}</p>
                        <p>Total producto: ${finalTotalProduct}</p>
                        <p>Envío: ${finalEnvio}</p>
                        <p>Total neto: ${finalTotalPrice}</p>
                    `;
                    cartSummary.appendChild(finalSummary);
                }

                localStorage.removeItem("cart");
                cart.length = 0;
                updateCartDisplay();
            }
        } catch (error) {
            console.error("Error al enviar el pedido:", error);
            alert("Error al enviar el pedido");
        }
    });

    // Cargar productos al iniciar
    fetchProducts();
});