interface Config {
  entity: string;
  delayInMinutes: number;
}

type Optional<T> = T | null;

interface Schema {
  name: string;
}

class DashboardPhotoFrameElement extends HTMLElement {
  private frameElement: Optional<HTMLDivElement> = null;
  private delayTimeoutHandle: Optional<number> = null;
  private config: Optional<Config> = null;

  constructor() {
    super();
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: {} } },
        {
          name: "delayInMinutes",
          required: true,
          selector: { text: { type: "number" } },
        },
      ],
      computeLabel: (schema: Schema) => {
        switch (schema.name) {
          case "entity":
            return "URL Entity";
          case "delay":
            return "Slideshow Delay (Minutes)";
        }
        return undefined;
      },
      computeHelper: (schema: Schema) => {
        switch (schema.name) {
          case "entity":
            return "This text describes the function of the entity selector";
          case "delay":
            return "Number of minutes after the last interaction until the slideshow starts.";
        }
        return undefined;
      },
      assertConfig: (/*config: unknown*/) => {
        // TODO
      },
    };
  }

  set hass(hass: { states: Record<string, { state?: string }> }) {
    // Initialize the content if it's not there yet.
    if (this.config && this.isPhotoFrameVisible) {
      const entity = hass.states[this.config.entity];
      if (entity && entity.state && this.frameElement) {
        this.frameElement.style.backgroundImage = `url(${entity.state})`;
      } else {
        // TODO unavailable
      }
    }
  }

  private get isPhotoFrameVisible() {
    return !!this.frameElement?.parentElement;
  }

  private get delayInMilliseconds() {
    if (this.config) {
      return this.config.delayInMinutes * 60 * 1000;
    }
    return Number.MAX_SAFE_INTEGER;
  }

  connectedCallback() {
    if (!this.frameElement) {
      document.body.addEventListener("click", this.onClickBody);

      const frame = document.createElement("div");
      frame.style.backgroundColor = "black";
      frame.style.width = "100vw";
      frame.style.height = "100vh";
      frame.style.position = "absolute";
      frame.style.top = "0";
      frame.style.left = "0";
      frame.style.zIndex = "99999";
      frame.style.backgroundSize = "contain";
      frame.style.backgroundPosition = "center center";
      frame.style.backgroundRepeat = "no-repeat";
      frame.style.pointerEvents = "all";

      this.frameElement = frame;
      this.showSlideshow();
    }
  }

  disconnectedCallback() {
    if (this.frameElement) {
      this.frameElement.remove();
    }
    document.body.removeEventListener("click", this.onClickBody);
  }

  setConfig(config: object) {
    if (!("entity" in config) || !("delayInMinutes" in config)) {
      throw new Error("entity and delayInMinutes must be defined");
    }

    if (typeof config.entity !== "string") {
      throw new Error("entity needs to be a string.");
    }

    const delayInMinutes =
      typeof config.delayInMinutes === "number"
        ? config.delayInMinutes
        : typeof config.delayInMinutes === "string"
          ? Number.parseInt(config.delayInMinutes)
          : Number.NaN;
    if (Number.isNaN(delayInMinutes) || delayInMinutes <= 0) {
      throw new Error(
        "delayInMinutes needs to be a positive, non-zero integer",
      );
    }

    this.config = {
      entity: config.entity,
      delayInMinutes,
    };
  }

  private showSlideshow = () => {
    if (this.frameElement) {
      document.body.appendChild(this.frameElement);
    }
  };

  private resetSlideshow = () => {
    if (this.isPhotoFrameVisible && this.frameElement) {
      this.frameElement.remove();
    }

    if (this.delayTimeoutHandle) {
      clearTimeout(this.delayTimeoutHandle);
    }
    this.delayTimeoutHandle = setTimeout(() => {
      this.delayTimeoutHandle = null;
      this.showSlideshow();
    }, this.delayInMilliseconds);
  };

  private onClickBody = (e: MouseEvent) => {
    if (this.isPhotoFrameVisible) {
      e.stopPropagation();
    }
    this.resetSlideshow();
  };
}

customElements.define("dashboard-photo-frame", DashboardPhotoFrameElement);
