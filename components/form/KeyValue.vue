<script>
import debounce from 'lodash/debounce';
import { typeOf } from '@/utils/sort';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { asciiLike, escapeHtml } from '@/utils/string';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { downloadFile } from '@/utils/download';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import ClickExpand from '@/components/formatter/ClickExpand';
import { get } from '@/utils/object';
import CodeMirror from '@/components/CodeMirror';
import { mapGetters } from 'vuex';
import ButtonDropdown from '@/components/ButtonDropdown';
import FileSelector from '@/components/form/FileSelector';

const LARGE_LIMIT = 2 * 1024;

/*
  @TODO
  - Paste
  - Read from file
  - Multiline
  - Concealed value
*/

export default {
  components: {
    TextAreaAutoGrow,
    ClickExpand,
    CodeMirror,
    ButtonDropdown,
    FileSelector
  },

  props: {
    value: {
      type:     [Array, Object],
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    asMap: {
      type:    Boolean,
      default: true,
    },
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },

    title: {
      type:    String,
      default: ''
    },

    protip: {
      type:    [String, Boolean],
      default: 'ProTip: Paste lines of <code>key=value</code> or <code>key: value</code> into any key field for easy bulk entry',
    },

    padLeft: {
      type:    Boolean,
      default: false,
    },

    // For asMap=false, the name of the field that goes into the row objects
    keyName: {
      type:    String,
      default: 'key',
    },
    keyLabel: {
      type:    String,
      default: 'Key',
    },
    keyPlaceholder: {
      type:    String,
      default: 'e.g. foo'
    },

    separatorLabel: {
      type:    String,
      default: '',
    },

    // For asMap=false, the name of the field that goes into the row objects
    valueName: {
      type:    String,
      default: 'value',
    },
    valueLabel: {
      type:    String,
      default: 'Value',
    },
    valuePlaceholder: {
      type:    String,
      default: 'e.g. bar'
    },
    valueCanBeEmpty: {
      type:    Boolean,
      default: false,
    },
    valueBinary: {
      type:    Boolean,
      default: false,
    },
    valueMultiline: {
      type:    Boolean,
      default: true,
    },
    valueBase64: {
      type:    Boolean,
      default: false,
    },
    valueConcealed: {
      type:    Boolean,
      default: false,
    },

    addLabel: {
      type:    String,
      default: 'Add',
    },
    addIcon: {
      type:    String,
      default: 'icon-plus',
    },
    addAllowed: {
      type:    Boolean,
      default: true,
    },

    readLabel: {
      type:    String,
      default: 'Read from file'
    },
    readIcon: {
      type:    String,
      default: 'icon-upload',
    },
    readAllowed: {
      type:    Boolean,
      default: true,
    },
    readAccept: {
      type:    String,
      default: '*',
    },
    readMultiple: {
      type:    Boolean,
      default: false,
    },

    removeLabel: {
      type:    String,
      default: '',
    },
    removeIcon: {
      type:    String,
      default: 'icon-minus',
    },
    removeAllowed: {
      type:    Boolean,
      default: true,
    },

    parserSeparators: {
      type:    Array,
      default: () => [': ', '='],
    },
  },

  data() {
    // @TODO base64 and binary support for as Array (!asMap)
    if ( !this.asMap ) {
      const rows = (this.value || []).slice() ;

      rows.map((row) => {
        row._display = this.displayProps(row[this.valueName]);
      });

      return { rows };
    }

    const input = this.value || {};
    const rows = [];

    Object.keys(input).forEach((key) => {
      let value = input[key];

      if ( this.valueBase64 ) {
        value = base64Decode(value);
      }
      rows.push({
        key,
        value,
        _display: this.displayProps(value)
      });
    });

    if ( !rows.length && this.initialEmptyRow && this.mode !== _VIEW ) {
      rows.push({ [this.keyName]: '', [this.valueName]: '' });
    }

    return { rows };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    showAdd() {
      return !this.isView && this.addAllowed;
    },

    showRead() {
      return !this.isView && this.readAllowed;
    },

    showRemove() {
      return !this.isView && this.removeAllowed;
    },

    threeColumns() {
      return (this.valueBinary && this.isView) || this.showRemove;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    asciiLike,
    add(key = '', value = '', binary = false) {
      this.rows.push({
        [this.keyName]:   key,
        [this.valueName]: value,
        // binary,
      });
      this.queueUpdate();
      this.$nextTick(() => {
        const keys = this.$refs.key;
        const lastKey = keys[keys.length - 1];

        lastKey.focus();
      });
    },

    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },

    removeEmptyRows() {
      const cleaned = this.rows.filter((row) => {
        return (row.value.length || row.key.length);
      });

      this.$set(this, 'rows', cleaned);
    },

    onFileSelected(fileContents) {
      this.add(fileContents.name, fileContents.value, !asciiLike(fileContents.value));
    },

    download(idx, ev) {
      const row = this.rows[idx];
      const name = row[this.keyName];
      const value = row[this.valueName];

      downloadFile(name, value, 'application/octet-stream');
    },

    update() {
      if ( this.isView ) {
        return;
      }

      if ( !this.asMap ) {
        this.$emit('input', this.rows.slice());

        return;
      }
      const out = {};
      const keyName = this.keyName;
      const valueName = this.valueName;

      if (!this.rows.length) {
        this.$emit('input', out);
      }
      for ( const row of this.rows ) {
        let value = (row[valueName] || '');
        const key = (row[keyName] || '').trim();

        if (value && typeOf(value) === 'object') {
          out[key] = JSON.parse(JSON.stringify(value));
        } else {
          value = (value || '').trim();

          if ( value && this.valueBase64 ) {
            value = base64Encode(value);
          }

          if ( key && (value || this.valueCanBeEmpty) ) {
            out[key] = value;
          }
        }
        this.$emit('input', out);
      }
    },

    displayProps(value) {
      const binary = typeof value === 'string' && !asciiLike(value);
      const withBreaks = escapeHtml(value || '').replace(/(\r\n|\r|\n)/g, '<br/>\n');
      const byteSize = withBreaks.length || 0; // Blobs don't exist in node/ssr
      const isLarge = byteSize > LARGE_LIMIT;
      let parsed;

      if ( value && ( value.startsWith('{') || value.startsWith('[') ) ) {
        try {
          parsed = JSON.parse(value);
          parsed = JSON.stringify(parsed, null, 2);
        } catch {
        }
      }

      return {
        binary,
        withBreaks,
        isLarge,
        parsed,
        byteSize
      };
    },
    get
  }
};
</script>

<template>
  <div class="key-value" :class="mode">
    <template v-if="title || !!$slots.title">
      <div :style="{'display':'flex'}" class="clearfix">
        <slot name="title">
          <h2 :style="{'display':'flex'}">
            {{ title }}
          </h2>
        </slot>
      </div>
    </template>

    <div v-if="rows.length || isView" :class="{'extra-column':threeColumns}" class="kv-row headers">
      <label class="text-label" :class="{'view':isView}">
        {{ keyLabel }}
        <i v-if="protip && !isView" v-tooltip="protip" class="icon icon-info" style="font-size: 12px" />
      </label>
      <label class="text-label" :class="{'view':isView}">{{ valueLabel }}</label>
      <span v-if="threeColumns" :class="{'view':isView}" />
    </div>

    <div v-if="isView && !rows.length" class="kv-row last" :class="{'extra-column':threeColumns}">
      <div class="text-muted">
        &mdash;
      </div>
      <div class="text-muted">
        &mdash;
      </div>
      <div v-if="threeColumns" class="text-muted">
        &mdash;
      </div>
    </div>
    <div v-for="(row,i) in rows" :key="i" :class="{'extra-column':threeColumns, 'last':i===rows.length-1}" class="kv-row">
      <div class="col">
        <slot
          name="key"
          :row="row"
          :mode="mode"
          :keyName="keyName"
          :valueName="valueName"
          :isView="isView"
        >
          <div v-if="isView" class="view force-wrap">
            {{ row[keyName] }}
          </div>
          <input
            v-else
            ref="key"
            v-model="row[keyName]"
            :placeholder="keyPlaceholder"
            @input="queueUpdate"
          />
        </slot>
      </div>

      <div class="col">
        <slot
          name="value"
          :row="row"
          :mode="mode"
          :keyName="keyName"
          :valueName="valueName"
          :isView="isView"
          :queueUpdate="queueUpdate"
        >
          <span v-if="(valueBinary || get(row, '_display.binary')) && !asciiLike(row[valueName])">
            {{ row[valueName].length }} byte<span v-if="row[valueName].length !== 1">s</span>
          </span>
          <div v-else-if="isView" class="view force-wrap">
            <template v-if="get(row, '_display.parsed')">
              <CodeMirror
                :options="{mode:{name:'javascript', json:true}, lineNumbers:false, foldGutter:false, readOnly:true}"
                :value="get(row, '_display.parsed')"
              />
            </template>
            <ClickExpand v-else-if="get(row, '_display.isLarge')" :value="row[valueName]" :size="get(row, '_display.byteSize')" />
            <span v-else-if="get(row, '_display.withBreaks')" v-html="get(row, '_display.withBreaks')" />
            <span v-else class="text-muted">&mdash;</span>
          </div>
          <TextAreaAutoGrow
            v-else-if="valueMultiline"
            v-model="row[valueName]"
            :placeholder="valuePlaceholder"
            :min-height="50"
            :spellcheck="false"
            @input="queueUpdate"
          />
          <input
            v-else
            v-model="row[valueName]"
            :placeholder="valuePlaceholder"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @input="queueUpdate"
          />
        </slot>
      </div>

      <div v-if="valueBinary && isView" class="col">
        <a href="#" @click="download(i, $event)">Download</a>
      </div>

      <div v-if="showRemove" class="col remove">
        <slot name="removeButton" :remove="remove" :row="row">
          <button type="button" class="btn bg-transparent role-link" @click="remove(i)">
            {{ removeLabel || t('generic.remove') }}
          </button>
        </slot>
      </div>
    </div>

    <div v-if="showAdd || showRead" class="footer mt-10">
      <slot name="add" :add="add">
        <ButtonDropdown size="sm">
          <template #button-content>
            <button v-if="showAdd" type="button" class="btn btn-sm add" @click="add()">
              {{ addLabel }}
            </button>
            <FileSelector v-else class="btn-sm" :label="t('generic.readFromFile')" :include-file-name="true" @selected="onFileSelected" />
          </template>
          <template v-if="showRead && showAdd" #popover-content>
            <ul class="list-unstyled">
              <li>
                <FileSelector class="btn-sm role-link" :label="readLabel" :include-file-name="true" @selected="onFileSelected" />
              </li>
            </ul>
          </template>
        </ButtonDropdown>
      </slot>
    </div>
  </div>
</template>

<style lang="scss">

.key-value {
  width: 100%;

  .file-selector.role-link {
    text-transform: initial;
    padding: 0;
  }

  .kv-row{
    display: grid;
    align-items: center;
    // this value keeps right-side padding consistent with row/col classed inputs
    grid-template-columns: 49.15% 49.15%;
    column-gap: $column-gutter;

    &.extra-column {
      grid-template-columns: 45% 45% auto;
    }

    & > .col {
      width: 100%;
    }

    &:not(.headers):not(.last){
      margin-bottom: 20px;
    }

    &.headers SPAN, &.headers LABEL {
      color: var(--input-label);
      &:not(.view) {
       margin-bottom:10px;
      }
    }
  }

  .remove BUTTON{
    padding: 0px;
  }

  .title {
    margin-bottom: 10px;

    .read-from-file {
      float: right;
    }
  }

  input {
    height: 50px;
  }

  .footer {

    .protip {
      float: right;
      padding: 5px 0;
    }
  }

  .download {
    text-align: right;
  }

}
</style>
