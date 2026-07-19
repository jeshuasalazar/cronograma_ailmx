// "Equipo" sidebar panel — member roster with active-task load counts.
import { getSidebarActivitiesQuery } from "./sidebarData.js";
import { escapeHtml, initials, avatarStyle } from "./format.js";

export function mountTeam(root, countEl, ctx) {
  function render() {
    const members = ctx.getMembers();
    const activitiesState = getSidebarActivitiesQuery().getState();

    if (!members.length) {
      root.innerHTML = `<div class="sk sk-row"></div>`;
      if (countEl) countEl.textContent = "";
      return;
    }
    if (countEl) countEl.textContent = `${members.length} miembro${members.length !== 1 ? "s" : ""}`;

    const items = activitiesState.status === "success" ? activitiesState.data : [];
    root.innerHTML = members
      .map((m) => {
        const load = items.filter((a) => a.assignees.includes(m.id) && a.status !== "done").length;
        return `<div class="tmember">
          <div class="av" style="${avatarStyle(m.color)}">${initials(m.name)}</div>
          <div class="info">
            <div class="nm">${escapeHtml(m.name)} ${m.isAdmin ? '<span class="admin-pill">ADMIN</span>' : ""}</div>
            <div class="rl">${escapeHtml(m.role || "")}</div>
          </div>
          <div class="load"><div class="lv">${load}</div><div class="ll">activas</div></div>
        </div>`;
      })
      .join("");
  }

  render();
  const unsub1 = ctx.membersQuery.subscribe(render);
  const unsub2 = getSidebarActivitiesQuery().subscribe(render);
  return () => {
    unsub1();
    unsub2();
  };
}
