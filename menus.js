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
    const apiUrl = "https://script.google.com/macros/s/AKfycbyK_dhbSSxREs9_2URso4hbSuodo4AouBzb-rIX5-DrEqi63ni1HH7-391MLbNYgiEO/exec"; // Actualiza con la nueva URL si es necesario

    // Cargar productos desde Google Sheets con GET (solo para menus.html)
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

    // Mostrar productos en las secciones correspondientes (solo para menus.html)
    function displayProducts(products) {
        const sections = {
            Entradas: document.getElementById("entradas-container"),
            PlatoFuerte: document.getElementById("platos-container"),
            Bebidas: document.getElementById("bebidas-container"),
            Postre: document.getElementById("postres-container")
        };

        console.log("Contenedores de categorías:", sections);

        products.forEach(product => {
            console.log("Producto:", product);
            const item = document.createElement("div");
            item.classList.add("menu-item");

            const imageUrl = product.imagen && product.imagen.startsWith("http")
                ? product.imagen
                : "https://via.placeholder.com/150";

            item.innerHTML = `
                <img src="${imageUrl}" alt="${product.producto}">
                <h3>${product.producto}</h3>
                <h5>${product.descripcion || ''}</h5>
                <p class="price">$${product.precio}</p>
                <div class="controls">
                    <button class="decrease">-</button>
                    <input type="text" value="1" readonly>
                    <button class="increase">+</button>
                </div>
                <button class="add-to-cart">Agregar</button>
            `;

            if (sections[product.Categorias]) {
                console.log(`Añadiendo ${product.producto} a ${product.Categorias}`);
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

        // Si el carrito está vacío, restablecer los valores
        if (cart.length === 0) {
            if (totalProducts) totalProducts.textContent = "0";
            if (val_t_prodcut) val_t_prodcut.textContent = "$0";
            if (envioEl) envioEl.textContent = `$${shippingCost.toLocaleString()}`;
            if (totalPrice) totalPrice.textContent = `$${shippingCost.toLocaleString()}`;
            return;
        }

        // Si hay productos, calcular los totales
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
        // Limpiar el carrito
        localStorage.removeItem("cart");
        cart.length = 0;
        updateCartDisplay();

        // Limpiar la información del cliente
        document.getElementById("address").value = "";
        document.getElementById("apartment").value = "";
        document.getElementById("phone").value = "";

        // Eliminar el "Resumen Final de Compra" del DOM
        const finalSummary = document.querySelector(".final-summary");
        if (finalSummary) {
            finalSummary.remove();
        }
    });

    // Finalizar compra con POST
    document.querySelector(".checkout")?.addEventListener("click", async () => {
        const order = {
            nombre_cliente: document.getElementById("address").value.trim(),
            telefono: document.getElementById("phone").value.trim(),
            direccion: document.getElementById("apartment").value.trim(),
            productos: cart.map(item => ({
                id: item.id || item.producto,
                precio: item.precio,
                cantidad: item.quantity
            })),
            valor_total: parseFloat(totalPrice.textContent.replace(/[^\d.]/g, ""))
        };

        if (!order.nombre_cliente || !order.telefono || !order.direccion || order.productos.length === 0) {
            alert("Por favor complete todos los datos y agregue productos al carrito.");
            return;
        }

        console.log("Enviando pedido:", order); // Depuración

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(order),
                mode: "no-cors", // Evita el preflight y el error CORS
                redirect: "follow"
            });

            // No podemos leer la respuesta con mode: "no-cors", asumimos que se envió correctamente
            const finalProducts = totalProducts.textContent;
            const finalTotalProduct = val_t_prodcut.textContent;
            const finalEnvio = envioEl.textContent;
            const finalTotalPrice = totalPrice.textContent;

            alert("Su compra ha sido finalizada. En un momento nuestro repartidor llevará su pedido.");
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
        } catch (error) {
            console.error("Error al enviar el pedido:", error);
            alert("Hubo un error al procesar el pedido. Verifica la consola para más detalles.");
        }
    });

    // Determinar en qué página estamos y ejecutar la lógica correspondiente
    if (window.location.pathname.includes("menus.html")) {
        fetchProducts();
    } else if (window.location.pathname.includes("carrito.html")) {
        updateCartDisplay();
    }
});
