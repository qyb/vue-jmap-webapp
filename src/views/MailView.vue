<script lang="ts">
/*
  在 mini 模式下，MsgList 和 MsgContent 将共享同一个 View
  所以 List/Content 的数据都封装在这里完成
 */
import { defineComponent } from 'vue'
import { MINI_STATE, FULL_STATE } from '@/utils/screen';

export default defineComponent({
  name: 'MailView',

  props: {
    widthState: {
      type: Number,
      required: true
    },
  },

  data () {
    return {
    }
  },

  methods: {

  },

  mounted () {
    console.log('MailView mounted Props.widthState:', this.widthState)
  },

  computed: {
    showList () {
      return this.widthState > MINI_STATE
    },
    msglistClass () {
      return this.widthState == FULL_STATE ? 'msglist-full' : 'msglist-normal'
    },
  }
})
</script>
<template>
  <div class="mailview">
    <div :class="msglistClass" class="msglist" v-if="showList">
      foo
    </div>
    <div class="msgcontent">bar</div>
  </div>
</template>

<style>
.mailview {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
}

.msglist {
  background-color: #edf0f2;
  color: #344955;
}

.msglist-normal {
  width: 350px;
  max-width: 350px;
}

.msglist-full {
  width: 376px;
  max-width: 380px;
}

.msgcontent {
  flex-grow: 1;
  background-color: #fefefe;
  color: #344955;
}
</style>
