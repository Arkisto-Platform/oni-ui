import "regenerator-runtime";
import "@/assets/tailwind.css";
import "element-plus/theme-chalk/index.css";
import {library} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import {
    faHome,
    faUser,
    faUserSecret,
    faArrowAltCircleDown,
    faQuestion,
    faCircleQuestion,
    faInfo,
    faArrowLeft,
    faMaximize,
    faMinimize,
    faDownload, faLockOpen, faLock, faUserLock, faCircleInfo, faChevronUp, faChevronDown, faChevronRight
} from '@fortawesome/free-solid-svg-icons'

library.add(faHome, faUser, faUserSecret, faArrowAltCircleDown, faQuestion, faCircleQuestion, faInfo, faArrowLeft, faMaximize, faMinimize, faDownload, faUserLock, faLock, faLockOpen, faCircleInfo, faChevronUp, faChevronDown, faChevronRight)

import {createApp} from "vue";
import App from "./App.vue";
import router from "./routes";
import {store} from "./store";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import log from "loglevel";
import prefix from "loglevel-plugin-prefix";
import VuePapaParse from 'vue-papa-parse'

const level = process.env.NODE_ENV === "development" ? "debug" : "warn";
log.setLevel(level);
const prefixer = prefix.noConflict();
prefixer.reg(log);
prefixer.apply(log);
import {io} from "socket.io-client";
import HTTPService from "./http.service";
import MembershipService from "./membership.service";
import ElasticService from "./elastic.service";
import VueGtag from "vue-gtag";

(async () => {
    const app = createApp(App);
    app.use(store);
    app.use(router);
    app.use(ElementPlus);
    app.use(VuePapaParse);
    app.component('font-awesome-icon', FontAwesomeIcon);
    app.config.globalProperties.$http = new HTTPService({router, loginPath: "/login"});
    app.config.globalProperties.$log = log;
    
    let response = await fetch("/api/configuration");
    //Stub configuration if API is down
    let configuration = {}
    if (response.status === 200) {
        configuration = await response.json();
    } else {
        configuration.ui = null;
    }
    if (configuration.ui && configuration.ui?.analytics?.['gaMeasurementId']) {
        app.use(VueGtag, {
            config: {id: configuration.ui.analytics['gaMeasurementId']},
            router
        });
    }
    store.commit("saveConfiguration", {...configuration});

    app.config.globalProperties.$membership = new MembershipService({router});
    app.config.globalProperties.$elasticService = new ElasticService({router, configuration});

  
    app.mount("#app");

    // app.config.globalProperties.$socket = io();
    // app.config.productionTip = false;

})();
