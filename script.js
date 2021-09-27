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

class Workout {
  id;
  #clicks = 0;
  constructor(coordinates, distance, duration) {
    this.duration = duration;
    this.distance = distance;
    this.coordinates = coordinates;
    this.id = Date.now();
  }
  getMessage() {
    const formatedActivity =
      this.activity[0].toUpperCase() + this.activity.slice(1);
    this.message = `${
      this.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
    } ${formatedActivity} on ${new Date(this.id).getDate()} ${
      months[new Date(this.id).getMonth()]
    }`;
  }
}
class Running extends Workout {
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration);
    this.cadence = cadence;
    this.Pace();
    this.activity = 'running';
  }
  Pace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  constructor(coordinates, distance, duration, elevationGain) {
    super(coordinates, distance, duration);
    this.elevationGain = elevationGain;
    this.Speed();
    this.activity = 'cycling';
  }
  Speed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #mapObj;
  #mapEvent;
  #mapZoomLevel;
  #workouts = [];
  constructor() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Not able to get Location');
      }
    );

    this.#mapZoomLevel = 13;
    containerWorkouts.addEventListener(
      'click',
      this._focusActivityOnMap.bind(this)
    );
    this.#workouts = this.getStoredWorkouts() || [];
    this.#workouts.forEach(this._showUserWorkoutData);
  }
  _loadMap(evt) {
    const coords = [32.3501276, -90.0025576];
    this.#mapObj = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot//{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#mapObj);

    L.marker(coords).addTo(this.#mapObj); //.bindPopup().openPopup();
    this.#mapObj.on('click', this._showForm.bind(this));
    const typeElement = document.querySelector('.form__input--type');
    typeElement.addEventListener('change', this._updateFieldOnChange);
    form.addEventListener('submit', this._processForm.bind(this));
    this.#workouts.forEach(this._showMapTag.bind(this));
  }
  _showForm(mapEvent) {
    this.#mapEvent = mapEvent;
    form.classList.remove('hidden');
  }
  _processForm(evt) {
    evt.preventDefault();
    this._validateForm();
  }
  _validateForm(evt) {
    const isValidInput = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const isAllPositive = (...inputs) => inputs.every(input => input > 0);
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (!isValidInput(distance, duration, cadence)) {
        return window.alert('only number values!');
      }
      if (!isAllPositive(distance, duration, cadence)) {
        return window.alert('only positive value!');
      }
      const run = new Running(
        this.#mapEvent.latlng,
        distance,
        duration,
        cadence
      );
      run.getMessage();
      this.#workouts.push(run);
      this._showMapTag(run);
      this._showUserWorkoutData(run);
      this._hideForm();
      this.__storeWorkouts(this.#workouts);
    }
    if (inputType.value === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!isValidInput(distance, duration, elevationGain)) {
        return window.alert('only number values!');
      }
      if (!isAllPositive(distance, duration)) {
        return window.alert('only positive number!');
      }
      const cycle = new Cycling(
        this.#mapEvent.latlng,
        distance,
        duration,
        elevationGain
      );
      cycle.coordinates = this.#mapEvent.latlng;
      cycle.getMessage();
      this.#workouts.push(cycle);
      this._showMapTag(cycle);
      this._showUserWorkoutData(cycle);
      this._hideForm();
      this.__storeWorkouts(this.#workouts);
    }
  }
  _showMapTag(workout) {
    L.marker([workout.coordinates.lat, workout.coordinates.lng])
      .addTo(this.#mapObj)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.activity}-popup`,
        })
      )
      .setPopupContent(workout.message)
      .openPopup();
  }
  _updateFieldOnChange() {
    document
      .querySelector('.form__input--elevation')
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
    document
      .querySelector('.form__input--cadence')
      .closest('.form__row')
      .classList.toggle('form__row--hidden');
  }
  _showUserWorkoutData(workout) {
    let html;
    if (workout.activity === 'running') {
      html = `<li class="workout workout--running" data-id=${workout.id}>
          <h2 class="workout__title">${workout.message}</h2>
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
        </li>`;
    }
    if (workout.activity === 'cycling') {
      html = `<li class="workout workout--running" data-id=${workout.id}>
          <h2 class="workout__title">${workout.message}</h2>
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
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
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
  _focusActivityOnMap(evt) {
    if (!evt.target.closest('.workout')) return;
    const workout = this.#workouts.find(
      workout =>
        workout.id === Number(evt.target.closest('.workout').dataset.id)
    );
    this.#mapObj.setView(
      [workout.coordinates.lat, workout.coordinates.lng],
      this.#mapZoomLevel,
      {
        animate: true,
        pan: { duration: 1 },
      }
    );
  }
  __storeWorkouts(workouts) {
    window.localStorage.setItem(
      localStorage_Workout_Key,
      JSON.stringify(workouts)
    );
  }
  getStoredWorkouts() {
    return JSON.parse(window.localStorage.getItem(localStorage_Workout_Key));
  }
  reset() {
    window.localStorage.removeItem(localStorage_Workout_Key);
    location.reload();
  }
}
const myApp = new App();
