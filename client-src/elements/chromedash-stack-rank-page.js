import {LitElement, css, html} from 'lit';
import './chromedash-stack-rank';
import {showToastMessage} from './utils';
import {SHARED_STYLES} from '../sass/shared-css.js';


export class ChromedashStackRankPage extends LitElement {
  static get styles() {
    return [
      ...SHARED_STYLES,
      css`
        h3 {
          margin: var(--content-padding) 0;
          font-weight: 500;
          color: #000;
        }

        .description {
          margin-bottom: 1em;
        }
        .description #highlighted-text {
          font-weight: 500;
        }

        #datalist-input {
          width: 30em;
          max-width: 100%;
          border-radius: 10px;
          height: 25px;
          margin-bottom: var(--content-padding);
          padding-left: 10px;
          font-size: 15px;
        }
      `];
  }

  static get properties() {
    return {
      type: {type: String}, // "css" or "feature"
      view: {type: String}, // "popularity" or "animated"
      viewList: {attribute: false},
      tempList: {attribute: false},
    };
  }

  constructor() {
    super();
    this.type = '';
    this.view = '';
    this.viewList = [];
    this.tempList = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadAll();
  }

  loadAll() {
    let endpoint = `/data/${this.type}${this.view}`;

    // [DEV] Change to true to use the staging server endpoint for development
    const devMode = false;
    if (devMode) endpoint = 'https://cr-status-staging.appspot.com' + endpoint;
    const options = {credentials: 'omit'};

    fetch(endpoint, options).then((res) => res.json()).then((props) => {
      for (let i = 0, item; item = props[i]; ++i) {
        item.percentage = (item.day_percentage * 100).toFixed(6);
      }
      const viewList = props.filter((item) => {
        return !['ERROR', 'PageVisits', 'PageDestruction'].includes(item.property_name);
      });
      this.tempList = viewList.slice(0, 30);
      // Set a timeout to avoid batch updates for tempList and viewList.
      setTimeout(() => {
        this.viewList = viewList;
      }, 300);
    }).catch(() => {
      showToastMessage('Some errors occurred. Please refresh the page or try again later.');
    });
  }

  handleSearchBarChange(e) {
    const inputValue = e.currentTarget.value;
    const property = this.viewList.find((item) => item.property_name === inputValue);
    window.location.href = `/metrics/${this.type}/timeline/${this.view}/${property.bucket_id}`;
  }

  renderSubheader() {
    const typeText = this.type == 'css'? 'CSS': 'HTML & JavaScript';
    const viewText = this.view == 'animated' ? 'animated' : 'all';
    const propText = this.type == 'css' ? 'properties' : 'features';
    const subTitleText = `${typeText} usage metrics > ${viewText} ${propText} > stack rank`;
    return html`<h2>${subTitleText}</h2>`;
  }

  renderSearchBar() {
    return html`
      <input id="datalist-input" type="search" list="features"
        placeholder=${this.viewList.length ? 'Select or search a property for detailed stats' : 'loading...'}
        @change="${this.handleSearchBarChange}" />
      <datalist id="features">
        ${this.viewList.map((item) => html`
          <option value="${item.property_name}" dataset-debug-bucket-id="${item.bucket_id}"></option>
        `)}
      </datalist>
    `;
  }

  renderDataPanel() {
    return html`
      <h3>Data from last 24 hours</h3>
      <p class="description">
        The percentage numbers indicate the <span id="highlighted-text">percentage of Chrome page loads
        (across all channels and platforms) that use the ${this.type == 'css'? 'property': 'feature'}
        at least once</span>. Data is collected via Chrome's
        <a href="https://cs.chromium.org/chromium/src/tools/metrics/histograms/enums.xml"
        target="_blank" rel="noopener">anonymous usage statistics</a>.
      </p>
      <chromedash-stack-rank
        .type=${this.type}
        .view=${this.view}
        .tempList=${this.tempList}
        .viewList=${this.viewList}>
      </chromedash-stack-rank>
    `;
  }

  render() {
    return html`
      <div id="subheader">
        ${this.renderSubheader()}
      </div>
      ${this.renderSearchBar()}
      ${this.renderDataPanel()}
    `;
  }
}

customElements.define('chromedash-stack-rank-page', ChromedashStackRankPage);
