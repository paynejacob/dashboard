<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import Mount from '@/edit/workload/storage/Mount';
import VolumeMount from '@/edit/workload/storage/volume-mount.js';
import { mapGetters } from 'vuex';

export default {
  components: {
    LabeledSelect, LabeledInput, Checkbox, Mount
  },

  mixins: [VolumeMount],

  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
  computed: {
    driverComponent() {
      try {
        return require(`@/edit/workload/storage/ephemeralVolume/${ this.value.csi.driver }`).default;
      } catch {
        return null;
      }
    },

    driverOpts() {
      return require.context('@/edit/workload/storage/ephemeralVolume', true, /^.*\.vue$/).keys().map(path => path.replace(/(\.\/)|(.vue)/g, '')).filter(file => file !== 'index');
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <div>
    <button type="button" class="role-link btn btn-lg remove-vol" @click="$emit('remove')">
      <i class="icon icon-2x icon-x" />
    </button>
    <div class="bordered-section">
      <h3>{{ t('workload.storage.subtypes.csi') }}</h3>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledSelect v-model="value.csi.driver" :mode="mode" label="Driver" :options="driverOpts" :get-option-label="opt=>t(`workload.storage.csi.drivers.'${opt}'`)" />
        </div>
      </div>
      <div v-if="value.csi.driver && driverComponent" class="mb-10">
        <component :is="driverComponent" :value="value.csi.volumeAttributes" :mode="mode" />
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="value.csi.fsType" :label="t('workload.storage.csi.fsType')" />
        </div>
        <div class="col span-6">
          <Checkbox v-model="value.csi.readOnly" :label="t('workload.storage.readOnly')" />
        </div>
      </div>
    </div>
    <Mount v-model="volumeMounts" :name="value.name" :mode="mode" />
  </div>
</template>
