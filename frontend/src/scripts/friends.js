// @ts-check

window.addEventListener("load", () => {
  const friendsOnlineList = document.getElementById("friendsOnlineList");
  const friendsAllList = document.getElementById("friendsAllList");
  const friendsRequestsList = document.getElementById("friendsRequestsList");

  if (!(friendsOnlineList instanceof HTMLElement)) return;
  if (!(friendsAllList instanceof HTMLElement)) return;
  if (!(friendsRequestsList instanceof HTMLElement)) return;

  /**
   * @typedef {{
   *  id: string,
   *  name: string,
   *  elo: number,
   *  avatar: string,
   *  online: boolean,
   *  streak: number
   * }} Friend
   */

  /**
   * @typedef {{
   *  id: string,
   *  name: string,
   *  elo: number,
   *  avatar: string
   * }} FriendRequest
   */

  /** @type {Friend[]} */
  const friends = [
    { id: "1", name: "Carlos", elo: 1750, avatar: "/avatars/1.png", online: true,  streak: 3 },
    { id: "2", name: "Lucía", elo: 1690, avatar: "/avatars/2.png", online: false, streak: 1 },
    { id: "3", name: "Marcos", elo: 1650, avatar: "/avatars/3.png", online: true,  streak: 5 },
    { id: "4", name: "Ana", elo: 1600, avatar: "/avatars/4.png", online: false, streak: 0 },
    { id: "5", name: "Juan", elo: 1600, avatar: "/avatars/5.png", online: false, streak: 0 }
  ];

  /** @type {FriendRequest[]} */
  const requests = [
    { id: "5", name: "Javier", elo: 1500, avatar: "/avatars/default.png" },
    { id: "6", name: "Sofía",  elo: 1580, avatar: "/avatars/default.png" }
  ];

  /**
   * @param {Friend} friend
   */
  function createFriendCard(friend) {
    const card = document.createElement("div");
    card.className = "friend-card";

    card.innerHTML = `
      <div class="friend-left">
        <img class="friend-avatar" src="${friend.avatar}" alt="${friend.name}">
        <div class="friend-info">
          <span class="friend-name">${friend.name}</span>
          <span class="friend-elo">${friend.elo} ELO</span>
          <span class="friend-status">${friend.online ? "En línea" : "Desconectado"}</span>
        </div>
      </div>
      <div class="friend-buttons">
        <button class="friend-btn challenge">Retar</button>
      </div>
    `;

    return card;
  }

  /**
   * @param {FriendRequest} req
   */
  function createRequestCard(req) {
    const card = document.createElement("div");
    card.className = "friend-card";

    card.innerHTML = `
      <div class="friend-left">
        <img class="friend-avatar" src="${req.avatar}" alt="${req.name}">
        <div class="friend-info">
          <span class="friend-name">${req.name}</span>
          <span class="friend-elo">${req.elo} ELO</span>
        </div>
      </div>
      <div class="friend-buttons">
        <button class="friend-btn accept">Aceptar</button>
        <button class="friend-btn decline">Rechazar</button>
      </div>
    `;

    return card;
  }

  friends.filter(f => f.online).forEach(f => friendsOnlineList.appendChild(createFriendCard(f)));
  friends.forEach(f => friendsAllList.appendChild(createFriendCard(f)));
  requests.forEach(r => friendsRequestsList.appendChild(createRequestCard(r)));
});
