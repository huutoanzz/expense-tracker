    <script setup lang="ts">
    import { reactive } from 'vue'

    const emit = defineEmits(['review-submitted'])

    const review = reactive({
    name: '',
    content: '',
    rating: null as number | null
    })

    const onSubmit = () => {
    if (!review.name || !review.content || review.rating === null) return

    const productReview = {
        name: review.name,
        content: review.content,
        rating: review.rating
    }

    emit('review-submitted', productReview)

    // Reset form
    review.name = ''
    review.content = ''
    review.rating = null
    }
    </script>

    <template>
    <form 
        class="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100"
        @submit.prevent="onSubmit"
    >
        <h3 class="text-2xl font-bold text-gray-800 mb-6">Leave a Review</h3>

        <!-- Name -->
        <div class="mb-5">
        <label 
            for="name" 
            class="block mb-2 text-sm font-medium text-gray-700"
        >
            Your Name
        </label>
        <input
            id="name"
            v-model="review.name"
            type="text"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 shadow-sm"
            placeholder="Enter your name"
        />
        </div>

        <!-- Review content -->
        <div class="mb-5">
        <label 
            for="review" 
            class="block mb-2 text-sm font-medium text-gray-700"
        >
            Your Review
        </label>
        <textarea
            id="review"
            v-model="review.content"
            rows="3"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 shadow-sm resize-y"
            placeholder="Share your thoughts about the product..."
        ></textarea>
        </div>

        <!-- Rating -->
        <div class="mb-6">
        <label 
            for="rating" 
            class="block mb-2 text-sm font-medium text-gray-700"
        >
            Rating
        </label>
        <select
            id="rating"
            v-model="review.rating"
            required
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 shadow-sm bg-white"
        >
            <option value="" disabled selected>-- Select rating --</option>
            <option value="5">5 ★★★★★ - Excellent</option>
            <option value="4">4 ★★★★☆ - Good</option>
            <option value="3">3 ★★★☆☆ - Average</option>
            <option value="2">2 ★★☆☆☆ - Poor</option>
            <option value="1">1 ★☆☆☆☆ - Very poor</option>
        </select>
        </div>

        <!-- Submit button -->
        <button
        type="submit"
        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!review.name || !review.content || review.rating === null"
        >
        Submit Review
        </button>
    </form>
    </template>