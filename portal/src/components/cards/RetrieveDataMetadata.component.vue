<template>
  <ul>
    <li class="font-semibold">
      <el-link
          :href="`/api/object/meta?resolve-parts&noUrid&id=${id}`" download="ro-crate-metadata.json">
        Download metadata
      </el-link>
    </li>
    <li class="font-semibold">
      <el-link
          :href="`/api/object/meta?resolve-parts&noUrid&id=${id}`" target="_blank" rel="noreferrer noopener">
        Open metadata in a new window
      </el-link>
    </li>
  </ul>
</template>
<script>
import {first} from "lodash";

export default {
  props: ['id'],
  data() {
    return {
      metaPath: '',
      notebooks: []
    }
  },
  methods: {
    first,
  }
}
</script>
