<template>
  <el-row :justify="'center'" class="bg-gray-50 w-full">
    <el-col :span="24">
      <div class="container max-w-screen-lg mx-auto">
        <el-row>
          <el-col :xs="24" :sm="15" :md="24" :lg="24" :xl="24">
            <h3 class="relative space-x-3 font-bold p-3 text-xl select-none text-left">
              <a class="break-words no-underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                :href="`/object?id=${parentId}&_crateId=${crateId}&fileId=${id}`">
                <font-awesome-icon icon="fa fa-arrow-left" />
                {{ parentTitle }} </a>&nbsp;><span>{{ title || id }}</span>
            </h3>
          </el-col>
        </el-row>
        <el-row>
          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
            <file-resolve class="flex justify-center h-screen " :id="id" :resolve="resolve" :encoding="encoding"
              :crateId="crateId" :rootId="rootId" :name="title" :parentName="parentTitle" :hideOpenLink="true"
              :isPreview="false" :access="access" :license="license" />
          </el-col>
        </el-row>
      </div>
    </el-col>
  </el-row>
</template>

<script>
import 'element-plus/theme-chalk/display.css'
import FileResolve from './FileResolve.component.vue';
import { first } from 'lodash';
import { putLocalStorage } from '@/storage';

export default {
  components: {
    FileResolve
  },
  data() {
    return {
      id: '',
      crateId: '',
      title: '',
      resolve: true,
      encoding: '',
      rootId: '',
      parentId: '',
      parentTitle: '',
      access: [],
      license: []
    }
  },
  beforeMount() {
    this.id = this.$route.query.id;
    this.crateId = this.$route.query.crateId;

  },
  async mounted() {
    await this.getFileMetadata();
  },
  methods: {
    async getFileMetadata() {
      const metadata = await this.$elasticService.single({
        id: this.id,
        _crateId: this.crateId
      });
      this.metadata = metadata?._source;
      console.log(this.metadata);
      this.populateData();
      this.license = first(this.metadata?.license);
      this.access = this.metadata._access;
      putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
    },
    populateData() {
      this.title = first(this.metadata?.['name'])?.['@value'] || this.metadata['@id'];
      const parent = first(this.metadata['_parent']);
      this.parentId = parent['@id'];
      this.parentTitle = first(parent['name'])?.['@value'] || this.parentId;
      this.encoding = first(this.metadata?.['encodingFormat']);
    }
  }
}
</script>
