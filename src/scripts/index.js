import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { 
  getUserInfo, 
  getCardList, 
  setUserInfo, 
  setUserAvatar, 
  addNewCard, 
  deleteCard, 
  changeLikeCardStatus 
} from "./components/api.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

let currentUserId = null;

const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");
const profileSubmitButton = profileForm.querySelector(".popup__button");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const cardSubmitButton = cardForm.querySelector(".popup__button");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const avatarSubmitButton = avatarForm.querySelector(".popup__button");

const deleteCardModalWindow = document.querySelector(".popup_type_remove-card");
const deleteCardForm = deleteCardModalWindow.querySelector(".popup__form");
const deleteCardSubmitButton = deleteCardForm.querySelector(".popup__button");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoLikesText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoLikesList = cardInfoModalWindow.querySelector(".popup__list");

const logoButton = document.querySelector(".header__logo");

let cardToDelete = null;

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const renderLoading = (isLoading, button, defaultText, loadingText) => {
  button.textContent = isLoading ? loadingText : defaultText;
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, profileSubmitButton, "Сохранить", "Сохранение...");
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, profileSubmitButton, "Сохранить", "Сохранение...");
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, avatarSubmitButton, "Сохранить", "Сохранение...");
  
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, avatarSubmitButton, "Сохранить", "Сохранение...");
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, cardSubmitButton, "Создать", "Создание...");
  
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(
          cardData,
          currentUserId,
          {
            onPreviewPicture: handlePreviewPicture,
            onLike: handleLikeCard,
            onDelete: handleDeleteButtonClick,
          }
        )
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, cardSubmitButton, "Создать", "Создание...");
    });
};

const handleDeleteCardSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, deleteCardSubmitButton, "Да", "Удаление...");
  
  deleteCard(cardToDelete.id)
    .then(() => {
      cardToDelete.element.remove();
      closeModalWindow(deleteCardModalWindow);
      cardToDelete = null;
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, deleteCardSubmitButton, "Да", "Удаление...");
    });
};

const handleLikeCard = (cardId, isLiked, likeButton, likeCountElement) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((cardData) => {
      likeButton.classList.toggle("card__like-button_is-active");
      likeCountElement.textContent = cardData.likes.length;
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleDeleteButtonClick = (cardId, cardElement) => {
  cardToDelete = { id: cardId, element: cardElement };
  openModalWindow(deleteCardModalWindow);
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      cardInfoTitle.textContent = "Статистика карточек";
      cardInfoList.innerHTML = '';
      cardInfoLikesList.innerHTML = '';

      const infoTemplate = document.getElementById("popup-info-definition-template");
      const userTemplate = document.getElementById("popup-info-user-preview-template");

      const allUserIds = new Set();
      cards.forEach(card => {
        allUserIds.add(card.owner._id);
        card.likes.forEach(like => allUserIds.add(like._id));
      });
      
      const totalUsersElement = infoTemplate.content.cloneNode(true);
      totalUsersElement.querySelector(".popup__info-term").textContent = "Всего пользователей:";
      totalUsersElement.querySelector(".popup__info-description").textContent = allUserIds.size.toString();
      cardInfoList.append(totalUsersElement);

      const totalLikes = cards.reduce((sum, card) => sum + card.likes.length, 0);
      const totalLikesElement = infoTemplate.content.cloneNode(true);
      totalLikesElement.querySelector(".popup__info-term").textContent = "Всего лайков:";
      totalLikesElement.querySelector(".popup__info-description").textContent = totalLikes.toString();
      cardInfoList.append(totalLikesElement);

      const userLikes = {};
      cards.forEach(card => {
        card.likes.forEach(user => {
          if (!userLikes[user._id]) {
            userLikes[user._id] = {
              name: user.name,
              count: 0
            };
          }
          userLikes[user._id].count++;
        });
      });

      let maxLikes = 0;
      let champion = "";
      Object.values(userLikes).forEach(user => {
        if (user.count > maxLikes) {
          maxLikes = user.count;
          champion = user.name;
        }
      });

      const maxLikesElement = infoTemplate.content.cloneNode(true);
      maxLikesElement.querySelector(".popup__info-term").textContent = "Максимально лайков от одного:";
      maxLikesElement.querySelector(".popup__info-description").textContent = maxLikes.toString();
      cardInfoList.append(maxLikesElement);

      const championElement = infoTemplate.content.cloneNode(true);
      championElement.querySelector(".popup__info-term").textContent = "Чемпион лайков:";
      championElement.querySelector(".popup__info-description").textContent = champion;
      cardInfoList.append(championElement);

      cardInfoLikesText.textContent = "Популярные карточки:";
      
      const sortedCards = [...cards]
        .sort((a, b) => b.likes.length - a.likes.length)
        .slice(0, 3);

      sortedCards.forEach(card => {
        const element = userTemplate.content.cloneNode(true);
        const listItem = element.querySelector(".popup__list-item_type_badge");
        listItem.textContent = `${card.name} (${card.likes.length} лайков)`;
        cardInfoLikesList.append(element);
      });

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

logoButton.addEventListener("click", handleLogoClick);

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
deleteCardForm.addEventListener("submit", handleDeleteCardSubmit);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    
    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(
          cardData,
          currentUserId,
          {
            onPreviewPicture: handlePreviewPicture,
            onLike: handleLikeCard,
            onDelete: handleDeleteButtonClick,
          }
        )
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });

const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

enableValidation(validationSettings);
