sGis.module('spatialProcessor.MapService', [
    'utils',
    'CRS',
    'EventHandler',
    'Bbox'
], (utils, CRS, EventHandler, Bbox) => {

    'use strict';

    let submodules = {};
    
    class MapService extends EventHandler {
        constructor(connector, name, serviceInfo) {
            super();
            this._connector = connector;
            this._name = name;
            this._meta = {};
            this.serviceInfo = serviceInfo;
        }
        
        static initialize(connector, name) {
            let url = connector.url + name + '/?_sb=' + connector.sessionId;
            return utils.ajaxp({url: url})
                .then(([response]) => {
                    try {
                        var serviceInfo = utils.parseJSON(response);
                        let layer;

                        if (serviceInfo.error) throw new Error();

                        if (serviceInfo.capabilities && serviceInfo.capabilities.indexOf('tile') >= 0) {
                            layer = new submodules.TileService(connector, name, serviceInfo);
                        } else {
                            layer = new submodules.DataViewService(connector, name, serviceInfo);
                        }

                        layer._subscribeForNotifications();

                        return layer;
                    } catch (e) {
                        throw new Error('Failed to initialize service ' + name);
                    }
                });
        }
        
        static register(name, module) {
            submodules[name] = module;
        }

        _subscribeForNotifications() {
            utils.ajaxp({url: this.url + 'subscribe?_sb=' + this._connector.sessionId})
                .then(() => {
                    this._connector.addNotificationListner('dynamic layer', this._name, this._redraw.bind(this));
                    this._connector.addNotificationListner('symbols', this._name, this.updateLegend.bind(this));
                });
        }

        _redraw() {
            if (this._layer) {
                this._layer.forceUpdate();
                this._layer.redraw();
            }
        }

        get url() {
            return this._connector.url + this._name + '/';
        }
        
        get serviceInfo() { return this._serviceInfo; }
        set serviceInfo(val) {
            this._crs = MapService.parseCrs(val.spatialReference);
            this._serviceInfo = val;
        }
        
        get crs() { return this._crs; }
        get layer() { return this._layer; }
        get connector() { return this._connector; }
        get name() { return this._name; }
        get alias() { return this.serviceInfo && this.serviceInfo.alias; }
        get description() { return this.serviceInfo && this.serviceInfo.description; }
        
        get isDisplayed() { return this._isDisplayed; }
        set isDisplayed(bool) {
            if (this._isDisplayed !== bool) {
                this._isDisplayed = bool;
                if (this.layer) this.layer.isDisplayed = bool;
                this.fire('visibilityChange');
            }
        }

        get hasLegend() { return this.serviceInfo && this.serviceInfo.capabilities.indexOf('legend') >= 0; }

        updateLegend() {
            if (this.hasLegend) return this._requestLegend().then(legend => {
                try {
                    this.legend = utils.parseJSON(legend[0]);
                } catch (e) {
                    this.legend = [];
                }
                this.fire('legendUpdate');
            });

            return new Promise((resolve, reject) => {
                reject("The service does not support legend rendering.");
            });
        }

        _requestLegend() {
            return utils.ajaxp({url: this.url + 'legend?_sb=' + this._connector.sessionId});
        }

        get attributesDefinition() {
            return this.serviceInfo && this.serviceInfo.attributesDefinition;
        }
        
        setMeta(key, value) {
            this._meta[key] = value;
        }
        
        getMeta(key) {
            return this._meta[key];
        }
        
        get meta() { return this._meta; }
        set meta(meta) { this._meta = meta; }

        get geometryType() { return this.serviceInfo.geometryType; }

        get permissions() { return this.serviceInfo.permissions; }
        
        static parseCrs(desc) {
            if (desc && crsMapping[desc]) {
                return crsMapping[desc];
            } else if (desc && desc.wkid && crsMapping[desc.wkid]) {
                return crsMapping[desc.wkid];
            } else if (desc && desc.wkid === 0) {
                return null;
            } else {
                return new sGis.Crs(desc);
            }
        }
        
        static serializeCrs(crs) {
            let keys = Object.keys(crsMapping);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                if (crsMapping[key].equals(crs)) return key;
            }
            
            return crs.description;
        }

        get fullExtent() {
            if (!this.serviceInfo.fullExtent) return null;
            return new Bbox([this.serviceInfo.fullExtent.xmin, this.serviceInfo.fullExtent.ymin], [this.serviceInfo.fullExtent.xmax, this.serviceInfo.fullExtent.ymax], this.crs);
        }

        get initialExtent() {
            if (!this.serviceInfo.initialExtent) return null;
            return new Bbox([this.serviceInfo.initialExtent.xmin, this.serviceInfo.initialExtent.ymin], [this.serviceInfo.initialExtent.xmax, this.serviceInfo.initialExtent.ymax], this.crs);
        }
    }

    MapService.prototype._isDisplayed = true;
    
    let crsMapping = {
        '102100': CRS.webMercator,
        '102113': CRS.webMercator,
        '667': CRS.ellipticalMercator
    };

    return MapService;

});