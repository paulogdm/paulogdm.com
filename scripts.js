Vue.component('badge-title', {
  template: `
    <div class="mt-4 mb-2">
      <h2 class="animated fadeIn"> <i class="fas fa-caret-right"></i> {{title}}</h2>
      <h6 class="animated fadeIn"><i class="animated fadeIn infinite">_</i> {{subtitle}}</h6>
    </div>
  `,
  props: {
    title: String,
    subtitle: String
  }
})

Vue.component('badge', {
  template: `
  <div class="badge text-center animated fadeInUp">
    <div class="front">
      <img class="img-fluid mx-auto d-block" v-bind:src="image">
    </div>
    <div class="back badge-text">
      <h6 v-html="content"></h6>
    </div>
  </div>
  `,
  props: {
    content: String,
    image: String
  }
})

const app = new Vue({
  el: '#mainpage',
  data: {
    lights: false
  },

  methods: {
    changeBackground: function () {
      this.lights = !this.lights
      const body = document.querySelector('body').classList
      body.toggle('background-white', this.lights)
      body.toggle('background-black', !this.lights)
      Cookies.set('lights', this.lights ? 'on' : 'off')
    }
  },

  created: function () {
    const lights = Cookies.get('lights')
    if (lights && (lights === 'off' || lights === 'on')) {
      this.lights = (lights === 'on')
      const body = document.querySelector('body').classList
      body.toggle('background-white', this.lights)
      body.toggle('background-black', !this.lights)
    } else {
      Cookies.set('lights', 'on')
    }
  }
})
