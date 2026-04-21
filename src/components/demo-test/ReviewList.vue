<script setup lang="ts">
defineProps<{
  reviews: {
    name: string
    content: string
    rating: number
  }[]
}>()
</script>

<template>
  <div class="reviews-section my-4 max-w-2xl mx-auto">
    <h3 class="text-2xl font-bold text-gray-800 mb-6">
      Customer Reviews
      <span v-if="reviews.length" class="text-gray-500 text-lg font-normal ml-2">
        ({{ reviews.length }})
      </span>
    </h3>
    <div class="space-y-6">
      <article
        v-for="(review, index) in reviews"
        :key="index"
        class="review-card bg-white p-6 sm:p-7 rounded-xl shadow-md border border-gray-100
               hover:shadow-lg transition-all duration-200"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <!-- Avatar placeholder -->
            <div class="w-10 h-10 rounded-full from-indigo-100 to-indigo-200 
                        flex items-center justify-center text-indigo-700 font-semibold">
              {{ review.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ review.name }}</p>
              <p class="text-sm text-gray-500">
                {{ new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }}
              </p>
            </div>
          </div>

          <!-- Stars -->
          <div class="flex items-center gap-1">
            <span 
              v-for="star in 5" 
              :key="star"
              class="text-2xl"
              :class="star <= review.rating ? 'text-yellow-400' : 'text-gray-200'"
            >
              ★
            </span>
          </div>
        </div>

        <blockquote class="text-gray-700 leading-relaxed">
          "{{ review.content }}"
        </blockquote>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* Optional: subtle hover effect on the whole card */
.review-card:hover {
  transform: translateY(-2px);
}
</style>