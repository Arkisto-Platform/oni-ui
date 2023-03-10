<template>
  <div class="px-10 pt-10 pb-7 sticky top-0 z-10 bg-white">
    <el-row :align="'middle'" class="mb-2 text-3xl font-medium dark:text-white">
      <h5><member-of-link :memberOf="metadata?._memberOf" />{{ first(this.name)?.['@value'] }}</h5>
    </el-row>
    <hr class="divider divider-gray pt-2" />
  </div>
  <el-row :justify="'center'" v-if="this.metadata" class="m-5 px-10" v-loading="loading">
    <el-col :xs="24" :sm="24" :md="24" :lg="16" :xl="16">
      <AccessHelper v-if="access" :access="access" :license="license" />
      <div class="px-5 pb-5">
        <MetaTopCard :tops="this.tops" :className="'py-5'" />
        <el-row class="">
          <el-col v-for="meta of this.meta">
            <meta-field :meta="meta" :routePath="'object'" :crateId="this.crateId" />
          </el-col>
        </el-row>
      </div>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
      <el-row :gutter="20" :align="'middle'" class="justify-center content-center pb-5">
        <el-col>
          <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
            <h5 class="text-2xl font-medium">Access</h5>
            <hr class="divider divider-gray pt-2" />
            <br />
            <license-card v-if="this.license?.['@id']" :license="license" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="pb-5">
        <el-col>
          <MemberOfCard :routePath="'collection'" :_memberOf="metadata?._memberOf" />
        </el-col>
      </el-row>
    </el-col>
  </el-row>
  <template v-if="parts && parts.length > 0">
    <el-row class="m-5 pl-10 pr-12">
      <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
        <div class="grid-content p-6">
          <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
            Files: {{ parts.length }}
          </h5>
        </div>
        <div></div>
      </el-col>
    </el-row>
    <el-row class="m-5 pl-10 pr-12 pb-7">
      <el-col>
        <ul>
          <li v-for="(part, index) of parts">
            <a :id="'part-' + encodeURIComponent(part?.['@id'])"></a>
            <object-part :part="part" :title="first(part?.name)?.['@value'] || part?.['@id']"
              :active="isPartActive(part?.['@id'], index)" :id="encodeURIComponent(part?.['@id'])"
              :encoding="first(part?.['encodingFormat'])" :crateId="this.crateId" :rootId="this.rootId"
              :parentName="first(this.name)?.['@value']" :parentId="this.$route.query.id" :license="license"
              :access="access" />
          </li>
        </ul>
      </el-col>
    </el-row>
  </template>
</template>
<script>
import { first, isUndefined, reject, isEmpty } from "lodash";
import { initSnip, toggleSnip } from "../tools";
import MetaField from "./MetaField.component.vue";
import { defineAsyncComponent } from 'vue';
import LicenseCard from './cards/LicenseCard.component.vue';
import MemberOfCard from './cards/MemberOfCard.component.vue';
import AccessHelper from './AccessHelper.component.vue';
import MemberOfLink from './widgets/MemberOfLink.component.vue';
import MetaTopCard from './cards/MetaTopCard.component.vue';
import { putLocalStorage } from '@/storage';

export default {
  components: {
    MetaTopCard,
    LicenseCard,
    MemberOfCard,
    MetaField,
    AccessHelper,
    MemberOfLink,
    ObjectPart: defineAsyncComponent(() =>
      import('./ObjectPart.component.vue')
    )
  },
  props: [],
  data() {
    return {
      id: null,
      config: this.$store.state.configuration.ui.object,
      fields: this.$store.state.configuration.ui.main.fields,
      helpers: this.$store.state.configuration.ui.helpers,
      metadata: {},
      name: '',
      tops: [],
      meta: [],
      license: [],
      licenseText: '',
      licenseSnipped: false,
      buckets: [],
      parts: [],
      crateId: '',
      rootId: '',
      access: [],
      activePart: null,
      loading: false
    }
  },
  updated() {
    const fileId = this.$route.query.fileId;
    if (fileId) {
      setTimeout(function () {
        console.log(fileId)
        const fileElement = document.getElementById('part-' + encodeURIComponent(fileId));
        fileElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
      }, 200);
    }
  },
  async mounted() {
    try {
      this.crateId = this.$route.query._crateId;
      this.loading = true;
      let metadata = null;
      const id = encodeURIComponent(this.$route.query.id);
      const _id = encodeURIComponent(this.$route.query._id);
      //encodeURIComponent may return "undefined" string
      if (id && id !== 'undefined') {
        if (isUndefined(this.crateId) || this.crateId === 'undefined') {
          await this.$router.push({ path: '/404' });
          this.loading = false;
        } else {
          metadata = await this.$elasticService.single({
            id,
            crateId: this.crateId
          });
        }
      } else if (_id && _id !== 'undefined') {
        metadata = await this.$elasticService.single({_id});
      }
      this.metadata = metadata?._source;
      //console.log(this.metadata);
      await this.populate();
      initSnip('#license', '#readMoreLicense');
      putLocalStorage({ key: 'lastRoute', data: this.$route.fullPath });
      this.loading = false;
    } catch (e) {
      console.error(e)
    }
  },
  methods: {
    first,
    isEmpty,
    toggleSnip,
    async populate() {
      this.rootId = first(this.metadata['_root'])?.['@id'];
      this.populateAccess();
      this.populateName(this.config.name);
      this.populateTop(this.config.top);
      this.populateMeta(this.config.meta);
      this.populateLicense();
      this.populateParts();
    },
    populateName(config) {
      this.name = this.metadata[config.name];
      this.nameDisplay = this.metadata[config.display];
    },
    populateTop(config) {
      for (let field of config) {
        let value;
        if (this.metadata[field.name]) {
          value = this.metadata[field.name]
        } else {
          value = [{ '@value': 'Not Defined' }];
        }
        this.tops.push({ name: field.display, value: value });
      }
    },
    populateMeta(config) {
      const keys = Object.keys(this.metadata);//.map(f => this.config.hide.find(f=> console.log(f)))
      const filtered = reject(keys, o => config.hide.find(f => o === f));
      for (let filter of filtered) {
        let helper = this.helpers.find(h => h.id === filter);
        if (!helper) {
          helper = {
            "id": filter,
            "display": filter,
            "url": "",
            "definition": "TODO: Add definition"
          }
        }
        this.meta.push({ name: filter, data: this.metadata[filter], help: helper });
      }
    },
    populateLicense() {
      this.license = first(this.metadata?.license);
      if (!this.license?.['@id']) {
        console.log('show alert! no license nono')
      } else {
        this.licenseText = first(this.license?.description)?.['@value'];
      }
    },
    populateParts() {
      this.parts = this.metadata.hasPart;
    },
    populateAccess() {
      this.access = this.metadata._access;
    },
    isPartActive(id, index) {
      console.log(this.$route.query.fileId, id, index)
      if (this.$route.query.fileId === id) {
        this.activePart = true;
        return true;
      } else if (index === 0 && !this.activePart) {
        return true;
      }
      return false;
    }
  }
}
</script>
