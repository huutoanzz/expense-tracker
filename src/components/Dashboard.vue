  <script setup>
    import {ref } from 'vue'

    import logoVue from '../assets/vue.svg'
    import logoVite from '../assets/vite.svg'
    import { ShoppingCart } from '@element-plus/icons-vue'
    import ProductDisplay from './ProductDisplay.vue'
    
    const logoImage1 = ref(logoVue)
    const logoImage2 = ref(logoVite)
    const premium = ref(false)
    const cart = ref([])

    const policies = ref([
      {
        id: 'PL001',
        title: 'Bảo hành',
        description: '12 tháng chính hãng'
      },
      {
        id: 'PL002',
        title: 'Đổi trả',
        description: '7 ngày miễn phí nếu lỗi nhà sản xuất'
      },
      {
        id: 'PL003',
        title: 'Vận chuyển',
        description: 'Giao hàng toàn quốc 2–5 ngày'
      },
      {
        id: 'PL004',
        title: 'Thanh toán',
        description: 'COD / Chuyển khoản / Ví điện tử'
      }
    ])

    const updateCart = ((id) => {
      cart.value.push(id)
    })


  </script>

  <template>
    <div class="w-full bg-green-300 flex items-center justify-center gap-4 p-4">
      <img
        :src="logoImage1"
        alt="Logo"
        class="w-16 h-16 object-contain"
      />
      <div class="text-center">
        <h1 class="text-3xl font-bold text-blue-600">Hello World</h1>
        <h1 class="text-3xl font-bold text-blue-900">This is my first Vue3 project</h1>
      </div>
      <img
        :src="logoImage2"
        alt="Logo"
        class="w-16 h-16 object-contain"
      />
    </div>

    <!-- CART ICON -->
    <div class="fixed top-24 right-6">
      <div class="relative bg-white p-3 rounded-full">
        <ShoppingCart class="w-8 h-8 text-green-600" />

        <span
          v-if="cart.length>0"
          class="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"
        >
          {{ cart.length }}
        </span>
      </div>
    </div>

    <ProductDisplay :premium="premium" @add-to-cart="updateCart"></ProductDisplay>

    <div class="w-full">
      <h3 class="text-xl font-bold text-red-600 text-center mt-10">Chính sách & Thông tin</h3>
      <h3 class="text-xl font-bold text-blue-600 text-right mr-20">Số dịch vụ cung cấp : {{ policies.length }}</h3>
      <table class="m-4 p-4 border border-solid border-collapse bg-green-50 w-[60%] mx-auto">
      <thead>
        <tr class="bg-green-300">
          <th class="border p-2">Mã dịch vụ</th>
          <th class="border p-2">Nội dung</th>
          <th class="border p-2">Chi tiết</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="pol in policies"
          :key="pol.id"
        >
          <td class="border p-2">{{ pol.id }}</td>
          <td class="border p-2">{{ pol.title }}</td>
          <td class="border p-2">{{ pol.description}}</td>
        </tr>
      </tbody>
      </table>
    </div>
    

  </template>

  <style scoped>
  </style>