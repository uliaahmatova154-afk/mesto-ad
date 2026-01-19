const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  cardData,
  currentUserId,
  { onPreviewPicture, onLike, onDelete }
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardTitle.textContent = cardData.name;
  likeCountElement.textContent = cardData.likes.length;

  const isLiked = cardData.likes.some(like => like._id === currentUserId);
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }

  const isOwner = cardData.owner._id === currentUserId;
  if (!isOwner) {
    deleteButton.remove();
  }

  likeButton.addEventListener("click", () => {
    const isCurrentlyLiked = likeButton.classList.contains("card__like-button_is-active");
    onLike(cardData._id, isCurrentlyLiked, likeButton, likeCountElement);
  });

  if (onDelete && deleteButton) {
    deleteButton.addEventListener("click", () => {
      onDelete(cardData._id, cardElement);
    });
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => {
      onPreviewPicture({ name: cardData.name, link: cardData.link });
    });
  }

  return cardElement;
};
