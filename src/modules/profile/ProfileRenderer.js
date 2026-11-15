function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thông tin";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" }).format(date);
}

export class ProfileRenderer {
  constructor(container = document.getElementById("profile-view")) {
    this.container = container;
  }

  setBusy(busy) {
    this.container?.setAttribute("aria-busy", String(busy));
  }

  renderLoading() {
    if (!this.container) return;
    this.setBusy(true);
    this.container.replaceChildren(
      element("div", "rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500", "Đang tải hồ sơ của bạn..."),
    );
  }

  renderError(message, onRetry) {
    if (!this.container) return;
    this.setBusy(false);
    const panel = element("div", "rounded-2xl border border-red-100 bg-white p-8 text-center");
    panel.append(
      element("h2", "text-lg font-semibold text-slate-900", "Không thể tải hồ sơ"),
      element("p", "mt-2 text-sm text-slate-500", message),
    );
    if (onRetry) {
      const button = element("button", "mt-5 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700", "Thử lại");
      button.type = "button";
      button.addEventListener("click", onRetry);
      panel.append(button);
    }
    this.container.replaceChildren(panel);
  }

  renderLoginRequired(onLogin) {
    if (!this.container) return;
    this.setBusy(false);
    const panel = element("div", "rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center");
    panel.append(
      element("div", "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-brand-accent", "♙"),
      element("h2", "mt-5 text-xl font-semibold text-slate-900", "Đăng nhập để xem hồ sơ"),
      element("p", "mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500", "Thông tin cá nhân và hoạt động mua sắm chỉ hiển thị khi bạn đã đăng nhập."),
    );
    const button = element("button", "mt-6 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-700", "Đăng nhập");
    button.type = "button";
    button.addEventListener("click", onLogin);
    panel.append(button);
    this.container.replaceChildren(panel);
  }

  renderProfile(profile, onSave) {
    if (!this.container) return;
    this.setBusy(false);
    const firstName = profile.firstName || "";
    const lastName = profile.lastName || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Khách hàng TriAD";
    const initials = [firstName, lastName].filter(Boolean).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase() || "T";
    const layout = element("div", "grid grid-cols-1 gap-6 lg:grid-cols-12");

    const sidebar = element("aside", "space-y-5 lg:col-span-4");
    const identity = element("section", "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm");
    const avatar = element("div", "flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white shadow-sm", initials);
    const identityName = element("h2", "mt-4 text-xl font-semibold text-slate-900", fullName);
    const identityEmail = element("p", "mt-1 break-all text-sm text-slate-500", profile.email || "");
    const role = element("span", "mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700", profile.role === "ADMIN" ? "Quản trị viên" : "Thành viên");
    identity.append(avatar, identityName, identityEmail, role);

    const shortcuts = element("section", "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm");
    shortcuts.append(element("h3", "text-sm font-semibold text-slate-900", "Truy cập nhanh"));
    const links = [
      ["Lịch sử đơn hàng", "order-history.html", "ph-receipt"],
      ["Tiếp tục mua sắm", "products.html", "ph-shopping-bag"],
    ];
    links.forEach(([label, href, icon]) => {
      const link = element("a", "mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700", label);
      link.href = href;
      const glyph = element("span", "ml-3 text-lg");
      glyph.innerHTML = `<i class="ph ${icon}" aria-hidden="true"></i>`;
      link.append(glyph);
      shortcuts.append(link);
    });
    sidebar.append(identity, shortcuts);

    const main = element("div", "space-y-6 lg:col-span-8");
    const formCard = element("section", "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8");
    const header = element("div", "mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between");
    const heading = element("div");
    heading.append(
      element("h2", "text-xl font-semibold text-slate-900", "Thông tin cá nhân"),
      element("p", "mt-1 text-sm leading-6 text-slate-500", "Cập nhật thông tin liên hệ để TriAD hỗ trợ bạn tốt hơn."),
    );
    const editLabel = element("span", "inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700", "Hồ sơ khách hàng");
    header.append(heading, editLabel);

    const form = element("form", "space-y-5");
    form.noValidate = true;
    const fields = [
      ["firstName", "Tên", firstName, "text"],
      ["lastName", "Họ", lastName, "text"],
      ["phone", "Số điện thoại", profile.phone || "", "tel"],
    ];
    fields.forEach(([name, label, value, type]) => {
      const wrapper = element("label", "block");
      wrapper.append(element("span", "mb-2 block text-sm font-medium text-slate-700", label));
      const input = element("input", "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10");
      input.name = name;
      input.type = type;
      input.value = value;
      input.autocomplete = name === "phone" ? "tel" : "given-name";
      input.required = name !== "phone";
      wrapper.append(input);
      form.append(wrapper);
    });

    const emailField = element("div", "block");
    emailField.append(element("span", "mb-2 block text-sm font-medium text-slate-700", "Email"));
    const email = element("div", "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500");
    email.textContent = profile.email || "Chưa có email";
    emailField.append(email, element("p", "mt-2 text-xs text-slate-400", "Email đăng nhập hiện chưa thể thay đổi tại đây."));
    form.append(emailField);

    const feedback = element("p", "hidden text-sm");
    feedback.id = "profile-feedback";
    const actions = element("div", "flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between");
    actions.append(element("p", "text-xs text-slate-400", "Thông tin được lưu an toàn trong tài khoản của bạn."));
    const submit = element("button", "inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60", "Lưu thay đổi");
    submit.type = "submit";
    actions.append(submit);
    form.append(feedback, actions);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      submit.disabled = true;
      feedback.className = "text-sm text-slate-500";
      feedback.textContent = "Đang lưu thay đổi...";
      try {
        const updated = await onSave(data);
        this.renderProfile(updated, onSave);
        window.toast?.success("Đã cập nhật", "Thông tin hồ sơ đã được lưu.");
      } catch (error) {
        feedback.className = "text-sm text-red-600";
        feedback.textContent = error?.message || "Không thể lưu thông tin. Vui lòng thử lại.";
        submit.disabled = false;
      }
    });
    formCard.append(header, form);

    const accountCard = element("section", "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8");
    accountCard.append(
      element("h2", "text-lg font-semibold text-slate-900", "Thông tin tài khoản"),
      element("p", "mt-1 text-sm text-slate-500", "Thông tin hệ thống liên quan đến tài khoản TriAD của bạn."),
    );
    const details = element("div", "mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2");
    [
      ["Trạng thái email", profile.isVerified ? "Đã xác minh" : "Chưa xác minh"],
      ["Xác thực hai lớp", profile.is2FAEnabled ? "Đang bật" : "Chưa bật"],
      ["Ngày tham gia", formatDate(profile.createdAt)],
      ["Vai trò", profile.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"],
    ].forEach(([label, value]) => {
      const item = element("div", "rounded-2xl bg-slate-50 p-4");
      item.append(element("p", "text-xs font-medium text-slate-500", label), element("p", "mt-2 text-sm font-semibold text-slate-900", value));
      details.append(item);
    });
    accountCard.append(details);
    main.append(formCard, accountCard);
    layout.append(sidebar, main);
    this.container.replaceChildren(layout);
  }
}
