import { AdminService } from "./AdminService.js";
import { authService } from "../auth/AuthService.js";

export class AdminProductController {
  constructor() {
    this.service = new AdminService();
    this.products = [];
    this._bindEvents();
  }

  async init() {
    if (!document.getElementById("admin-products-table-body")) return;
    if (
      !authService.isAuthenticated ||
      authService.getCurrentUser()?.role !== "ADMIN"
    ) {
      window.location.href = "./admin-dashboard.html";
      return;
    }
    await this.loadProducts();
  }

  async loadProducts() {
    const tbody = document.getElementById("admin-products-table-body");
    tbody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-10 text-center text-gray-400">Đang tải...</td></tr>';

    try {
      const res = await this.service.getProducts({}, 1, 50);
      this.products = res.products || [];
      this.renderTable();
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-red-500">Lỗi: ${error.message}</td></tr>`;
    }
  }

  renderTable() {
    const tbody = document.getElementById("admin-products-table-body");
    if (this.products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="px-6 py-10 text-center text-gray-400">Chưa có sản phẩm nào</td></tr>';
      return;
    }

    tbody.innerHTML = this.products
      .map(
        (p) => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <img src="${p.images?.[0] || "https://via.placeholder.com/40"}" class="w-10 h-10 rounded object-cover border" alt="">
            <div>
              <p class="font-medium text-gray-900">${p.name}</p>
              <p class="text-xs text-gray-500">${p.slug}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">${p.category}</td>
        <td class="px-6 py-4 font-medium">${Number(p.price).toLocaleString("vi-VN")} ₫</td>
        <td class="px-6 py-4">${p.stock}</td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}">
            ${p.isActive ? "Hoạt động" : "Đã ẩn"}
          </span>
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          <button data-action="edit" data-id="${p.id}" class="text-blue-600 hover:text-blue-800"><i class="ph ph-pencil-simple text-lg"></i></button>
          ${
            p.isActive
              ? `<button data-action="delete" data-id="${p.id}" class="text-red-600 hover:text-red-800"><i class="ph ph-trash text-lg"></i></button>`
              : `<button data-action="restore" data-id="${p.id}" class="text-green-600 hover:text-green-800"><i class="ph ph-arrow-counter-clockwise text-lg"></i></button>`
          }
        </td>
      </tr>
    `,
      )
      .join("");
  }

  _bindEvents() {
    // Nút mở modal Thêm
    document
      .getElementById("btn-add-product")
      ?.addEventListener("click", () => this.openModal());
    document
      .getElementById("close-product-modal")
      ?.addEventListener("click", () => this.closeModal());
    document
      .getElementById("cancel-product-btn")
      ?.addEventListener("click", () => this.closeModal());

    // Submit form
    document
      .getElementById("product-form")
      ?.addEventListener("submit", (e) => this.handleSubmit(e));

    // Click bảng
    document
      .getElementById("admin-products-table-body")
      ?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === "edit") this.handleEdit(id);
        if (action === "delete") this.handleDelete(id);
        if (action === "restore") this.handleRestore(id);
      });
  }

  openModal(product = null) {
    const modal = document.getElementById("product-modal");
    const content = modal.querySelector(".bg-white");
    const form = document.getElementById("product-form");

    form.reset();
    document.getElementById("product-id").value = product ? product.id : "";
    document.getElementById("product-modal-title").textContent = product
      ? "Sửa Sản phẩm"
      : "Thêm Sản phẩm";

    if (product) {
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-slug").value = product.slug;
      document.getElementById("product-desc").value = product.description || "";
      document.getElementById("product-price").value = product.price;
      document.getElementById("product-stock").value = product.stock;
      document.getElementById("product-category").value = product.category;
      document.getElementById("product-image").value =
        product.images?.[0] || "";
    }

    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.remove("opacity-0");
      content.classList.remove("scale-95");
    });
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    const modal = document.getElementById("product-modal");
    const content = modal.querySelector(".bg-white");
    modal.classList.add("opacity-0");
    content.classList.add("scale-95");
    setTimeout(() => modal.classList.add("hidden"), 300);
    document.body.style.overflow = "";
  }

  async handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("product-id").value;
    const isNewProduct = !id;

    const data = {
      name: document.getElementById("product-name").value.trim(),
      slug: document.getElementById("product-slug").value.trim(),
      description: document.getElementById("product-desc").value.trim(),
      price: Number(document.getElementById("product-price").value),
      stock: Number(document.getElementById("product-stock").value),
      category: document.getElementById("product-category").value.trim(),
      images: [document.getElementById("product-image").value.trim()],
      ...(isNewProduct && { isActive: true }),
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Đang lưu...";

    try {
      if (id) {
        await this.service.updateProduct(id, data);
        window.toast?.success("Thành công", "Đã cập nhật sản phẩm");
      } else {
        await this.service.createProduct(data);
        window.toast?.success("Thành công", "Đã thêm sản phẩm mới");
      }
      this.closeModal();
      await this.loadProducts();
    } catch (error) {
      window.toast?.error("Lỗi", error.message || "Không thể lưu sản phẩm");
    } finally {
      btn.disabled = false;
      btn.textContent = "Lưu sản phẩm";
    }
  }

  handleEdit(id) {
    const product = this.products.find((p) => p.id === id);
    if (product) this.openModal(product);
  }

  async handleDelete(id) {
    if (!confirm("Bạn có chắc chắn muốn ẩn/xoá sản phẩm này?")) return;
    try {
      await this.service.deleteProduct(id);
      window.toast?.success("Thành công", "Đã ẩn sản phẩm");
      await this.loadProducts();
    } catch (error) {
      window.toast?.error("Lỗi", error.message);
    }
  }

  async handleRestore(id) {
    try {
      await this.service.restoreProduct(id);
      window.toast?.success("Thành công", "Đã khôi phục sản phẩm");
      await this.loadProducts();
    } catch (error) {
      window.toast?.error("Lỗi", error.message);
    }
  }
}
