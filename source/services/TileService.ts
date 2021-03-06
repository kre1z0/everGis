import {ServiceContainer} from "./ServiceContainer";
import {MapService} from "./MapService";
import {TileLayer} from "sgis/dist/layers/TileLayer";
import {TileScheme} from "sgis/dist/TileScheme";
import {wgs84} from "sgis/dist/Crs";
import {Point} from "sgis/dist/Point";
import {ConditionalTileLayer} from "../layers/ConditionalTileLayer";

export class TileService extends MapService {
    private _tileScheme: TileScheme;
    constructor(name, connector, serviceInfo) {
        super(name, connector, serviceInfo);
        this._setLayer();
    }

    _setLayer() {
        if (this.serviceInfo.tileInfo) {
            this._tileScheme = getTileScheme(this.serviceInfo.tileInfo, this.crs);
        }

        let layerParams = {tileScheme: this._tileScheme, crs: this.crs, isDisplayed: this.isDisplayed};
        if (this.serviceInfo.attributesDefinition) {
            this._layer = new ConditionalTileLayer(this.url, this.connector.sessionId, layerParams);
        } else {
            this._layer = new TileLayer(this._getUrl(), layerParams);
        }
    }

    get tileScheme() { return this._tileScheme; }

    _getUrl() {
        if (this.serviceInfo.sourceUrl) {
            return this.serviceInfo.sourceUrl.replace(/^https?:/, '');
        } else {
            return this.url + 'tile/{z}/{y}/{x}' + (this.connector.sessionId ? '?_sb=' + this.connector.sessionId : '');
        }
    }
}

function getTileScheme(tileInfo, crs) {
    let scheme: any = {
        tileWidth: tileInfo.rows,
        tileHeight: tileInfo.cols,
        dpi: tileInfo.dpi,
        origin: [tileInfo.origin.x, tileInfo.origin.y],
        reversedY: tileInfo.reversedY,
        levels: [],
        limits: null
    };

    if (tileInfo.boundingRectangle) {
        let {MinX, MinY, MaxX, MaxY} = tileInfo.boundingRectangle;
        if (MinX !== MaxX && MinY !== MaxY) scheme.limits = [MinX, MinY, MaxX, MaxY];
    }

    let projection = wgs84.projectionTo(crs);
    if (projection && scheme.tileWidth) {
        let point1 = new Point([0, -180]).projectTo(crs);
        let point2 = new Point([0, 180]).projectTo(crs);
        var fullWidth = point2.x - point1.x;
    }
    for (let i = 0, len = tileInfo.lods.length; i < len; i++) {
        let resolution = tileInfo.lods[i].resolution;
        scheme.levels[i] = {
            resolution: resolution,
            scale: tileInfo.lods[i].scale,
            indexCount: Math.round(fullWidth / resolution / scheme.tileWidth),
            zIndex: tileInfo.lods[i].level
        };
    }

    return new TileScheme(scheme);
}

ServiceContainer.register(serviceInfo => serviceInfo.serviceType === 'DataView' && serviceInfo.capabilities.indexOf('tile') !== -1, TileService);
