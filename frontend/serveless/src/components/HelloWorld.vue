<template>

  <md-app>
    <md-app-toolbar class="md-primary">
      <md-button class="md-icon-button" @click="toggleMenu" v-if="!menuVisible">
        <md-icon>menu</md-icon>
      </md-button>
      <span class="md-title">Kubeless UI</span>
    </md-app-toolbar>

    <md-app-drawer :md-active.sync="menuVisible" md-persistent="full">
      <md-toolbar class="md-transparent" md-elevation="0">
        <span class="md-subheading">Functions</span>

        <div class="md-toolbar-section-end">
          <md-button class="md-icon-button md-dense" @click="toggleMenu">
            <md-icon>keyboard_arrow_left</md-icon>
          </md-button>
        </div>
      </md-toolbar>

      <md-list :md-expand-single="true">
        <md-list-item v-for="v in functions" v-bind:key="v.metadata.name" md-expand :md-expanded.sync="expandFunctions[v.metadata.name]">
          <a class="md-list-item-text" @click="functionFiles(v.metadata.namespace, v.metadata.name)"> {{ v.metadata.name}}</a>
          <md-list slot="md-expand">
            <md-list-item  class="md-inset" v-for="f in files" v-bind:key="f">
              <a class="md-list-item-text" @click="loadFile(v.metadata.namespace, v.metadata.name, f)"> {{f}}</a>
            </md-list-item>
          </md-list>
        </md-list-item>

      </md-list>
    </md-app-drawer>

    <md-app-content>
      <Monaco width="100%" height="800" :language="language" theme="vs-dark" :code="code || ''" :changeThrottle="500" @codeChange="(e) => code = e.getValue()" :options="{automaticLayout: true, wordWrap: 'on', autoIndent: true, folding: true}">
      </Monaco>
    </md-app-content>
  </md-app>

</template>

<script>
import Monaco from 'monaco-editor-forvue';
import FunctionProxy from '@/proxies/FunctionProxy';

export default {
  name: 'HelloWorld',
  props: {
    
  },
  data() {
    return {
      menuVisible: false,
      expandSingle: false,
      expandFunctions: {},
    code: '',
    functions: [],
    files: [],
    selectedFunction: '',
    language: 'javasctipt'
    }
  },
  components: {
      Monaco,
      FunctionProxy,
    },

  methods: {
    toggleMenu () {
        this.menuVisible = !this.menuVisible
      },
    functionFiles(ns, name) {
      this.selectedFunction = name;
      new FunctionProxy().files(ns, name).then((r) => {
        this.files = r;
    });
    },
    
    loadFile(ns, name, file) {
      new FunctionProxy().file(ns, name, file).then((r) => {
        if(r instanceof Object) {
          this.language = 'json';
          this.code = JSON.stringify(r, null, 2);
        } else {
          this.language = 'javascript';
          this.code = r.toString();
        }
    });
    }
  },

  mounted() {
    new FunctionProxy().list().then((r) => {
        this.functions = r.items;
        this.functions.forEach(e => {
          this.expandFunctions[e.metadata.name] = false;  
        })
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.row {
  display: flex;
}
.left {
  width: 500px;
}
.right {
  width: 100%;
}
/* .column {
    flex: 50%;
} */
</style>
