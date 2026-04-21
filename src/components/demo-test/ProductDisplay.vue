  <script setup>
    import { computed, ref } from 'vue'
    import logoVue from '../assets/vue.svg'
    import logoVite from '../assets/vite.svg'
    import ReviewForm from './ReviewForm.vue'
import ReviewList from './ReviewList.vue'

    const props = defineProps({
        premium:{
            type:Boolean,
            required:true
        }
    })
    const emit = defineEmits(['add-to-cart'])
    const product = ref("Logo Picture")
    const brand = ref("Draco")
    const reviews = ref([])
    const title = computed(() => {
      return brand.value + " " + product.value
    })
    const image = computed(() => {
      return variants.value[selectedVariant.value].image
    })
    const inStock = computed(() => {
      return variants.value[selectedVariant.value].quantity
    })
    const shipping = computed(() => {
        if(props.premium){
            return "Free"
        }
        return "2.99 $"
    })
    const detail = ref(["50% Cotton","30% Wool","20 % Polyester"])


    const addToCart = () => {
        if (variants.value[selectedVariant.value].quantity > 0) {
            variants.value[selectedVariant.value].quantity -= 1         
            emit('add-to-cart', variants.value[selectedVariant.value].id) 
        }
    }

    const selectedVariant = ref(0)
    const variants = ref([
      {id:2234, color:"green", image:logoVue, quantity:12},
      {id:2235, color:"purple",image:logoVite, quantity:3}
    ])
    const updateVariant = (index) => {
      selectedVariant.value = index
    }

    const addReview = (review) => {
      reviews.value.push(review)
    }
  </script>

  <template>
    <div class="w-full bg-blue-300 mt-10 p-6">
      <div class="flex flex-col md:flex-row gap-8 items-start justify-center">

        <!-- LEFT: IMAGE -->
        <div class="flex flex-col items-center md:w-1/3">
          <img
            :src="image"
            alt="Logo"
            class="w-60 h-60 object-contain"
          />

          <!-- COLOR VARIANTS (HORIZONTAL) -->
          <div class="flex gap-3 mt-4">
            <div
              v-for="(v , index) in variants"
              :key="v.id"
              @click="updateVariant(index)"
              class="color-circle cursor-pointer"
              :style="{ backgroundColor: v.color }"
            ></div>
          </div>
        </div>

        <!-- RIGHT: INFO -->
        <div class="flex flex-col gap-3 md:w-2/3">

          <h1 class="text-3xl font-bold text-red-600">
            {{ title }}
          </h1>

          <h1
            v-show="inStock > 0"
            class="text-lg font-bold text-green-700"
          >
            Item Available !!
          </h1>

          <h1
            v-if="inStock > 10"
            class="text-xl font-bold text-blue-600"
          >
            In Stock ({{ inStock }})
          </h1>

          <h1
            v-else-if="inStock > 0"
            class="text-xl font-bold text-yellow-600"
          >
            Almost outstock ({{ inStock }})
          </h1>

          <h1
            v-else
            class="text-xl font-bold text-red-600"
          >
            Outstock !!
          </h1>

          <h1
            class="text-xl font-bold text-black"
          >
            Shipping: <span class="text-red-600 text-xl">{{ shipping }}</span> 
          </h1>

          <!-- DETAIL -->
          <ul class="list-disc pl-5">
            <li
              v-for="d in detail"
              :key="d"
              class="text-lg font-medium"
            >
              {{ d }}
            </li>
          </ul>

          <!-- BUTTON -->
          <button
            @click="addToCart"
            class="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg shadow w-fit"
            :disabled="!inStock"
            :class="{ disableButton: !inStock }"
          >
            ➕ Add to Cart
          </button>
        </div>
      </div>
    </div>
    <div class="w-full bg-blue-200 p-6" >
      <ReviewList v-if="reviews.length > 0" :reviews="reviews"></ReviewList>
      <ReviewForm @review-submitted="addReview"></ReviewForm>
    </div>
  </template>

  <style scoped>

  </style>
