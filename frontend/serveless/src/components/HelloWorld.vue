<template>
  <div  class="row">
    <div class="column left">
      <ul>
        <li v-for="v in functions" v-bind:key="v.metadata.name">
          <a @click="functionFiles(v.metadata.namespace, v.metadata.name)"> {{ v.metadata.name}}</a>
          <ul v-if="selectedFunction == v.metadata.name">
            <li v-for="f in files" v-bind:key="f">
              <a @click="loadFile(v.metadata.namespace, v.metadata.name, f)"> {{f}}</a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div class="column right">
      <Monaco width="100%" height="800" :language="language" theme="vs-dark" :code="code || ''" :changeThrottle="500" @codeChange="(e) => code = e.getValue()" :options="{automaticLayout: true, wordWrap: 'on', autoIndent: true, folding: true}">
      </Monaco>
    </div>
  </div>
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
