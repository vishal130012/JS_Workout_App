'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const map = document.querySelector('#map');
const localStorage_Workout_Key = 'localStorage_Workout_data';
class WorkOut {
  date = new Date();
  id = Date.now();
  #clicks = 0;
  constructor(coords, distance, duration) {
    (this.coords = coords),
      (this.distance = distance),
      (this.duration = duration);
  }
  click() {
    this.#clicks++;
  }
}
class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  #mapObj;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel;
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    this.#mapZoomLevel = 13;
    this._getLocalStorage();
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('unable to get location');
        }
      );
    }
  }
  _loadMap(location) {
    const { latitude } = location.coords;
    const { longitude } = location.coords;
    const coords = [32.1623, -89.5853];
    this.#mapObj = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#mapObj);
    this.#mapObj.on('click', this._showForm.bind(this));
    this.#workouts.forEach(this._showSummaryOnMap.bind(this));
  }
  _showForm(mapEvt) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapEvent = mapEvt;
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }
  _newWorkout(evt) {
    const validateInput = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const validatePositiveDate = (...inputs) =>
      inputs.every(input => input > 0);

    evt.preventDefault();
    const activityType = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputDuration.value;
    const elevation = +inputElevation.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coordinates = [lat, lng];
    //const coordinates = { lat, lng };
    let workout;
    if (activityType === 'running') {
      if (!validateInput(distance, duration, cadence)) {
        return alert('please fill out all the requiured field');
      }
      if (!validatePositiveDate(distance, duration, cadence)) {
        return alert('Please provide only positive numbers');
      }
      workout = new Running(coordinates, distance, duration, cadence);
      this._showSummaryOnMap(workout);
      this._showActivitySummary(workout);
      this._hideForm();
    } else if (activityType === 'cycling') {
      if (!validateInput(distance, duration, elevation)) {
        return alert('please fill out all the requiured field');
      }
      if (!validatePositiveDate(distance, duration)) {
        return alert('Please provide only positive numbers');
      }
      workout = new Cycling(coordinates, distance, duration, elevation);
      this._showSummaryOnMap(workout);
      this._showActivitySummary(workout);
      this._hideForm();
    }
    this.#workouts.push(workout);
    this._setLocalStorage();
  }
  _showSummaryOnMap(workoutObj) {
    L.marker([workoutObj.coords[0], workoutObj.coords[1]])
      .addTo(this.#mapObj)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workoutObj.type}-popup`,
          datatset: workoutObj.id,
        })
      )
      .setPopupContent(
        `${workoutObj.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
          workoutObj.type[0].toUpperCase() + workoutObj.type.slice(1)
        } on ${new Date(workoutObj.id).toLocaleString('default', {
          month: 'long',
        })} ${new Date(workoutObj.id).getDate()}`
      )
      .openPopup();
  }
  _showActivitySummary(workout) {
    let listEl;
    if (workout.type === 'running') {
      listEl = `<li class="workout workout--running" data-id=${workout.id}>
          <h2 class="workout__title">${
            workout.type[0].toUpperCase() + workout.type.slice(1)
          } on ${new Date(workout.id).toLocaleString('default', {
        month: 'long',
      })} ${new Date(workout.id).getDate()}</h2>
          <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
`;
    }
    if (workout.type === 'cycling') {
      listEl = `<li class="workout workout--cycling" data-id=${workout.id}>
          <h2 class="workout__title">${
            workout.type[0].toUpperCase() + workout.type.slice(1)
          } on ${new Date(workout.id).toLocaleString('default', {
        month: 'long',
      })} ${new Date(workout.id).getDate()}</h2>
          <div class="workout__details">
            <span class="workout__icon">🚴‍♀️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
`;
    }
    form.insertAdjacentHTML('afterend', listEl);
  }
  _moveToPopup(evt) {
    const targetLiElement = evt.target.closest('.workout');
    if (!targetLiElement) return;
    const workout = this.#workouts.find(
      WO => WO.id === Number(targetLiElement.dataset.id)
    );
    this.#mapObj.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
    //  workout.click();
  }
  _setLocalStorage() {
    window.localStorage.setItem(
      localStorage_Workout_Key,
      JSON.stringify(this.#workouts)
    );
  }
  _getLocalStorage() {
    const data = JSON.parse(
      window.localStorage.getItem(localStorage_Workout_Key)
    );
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(this._showActivitySummary);
  }
}
const myApp = new App();
