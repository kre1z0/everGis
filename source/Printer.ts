import {ajaxp, parseJSON} from "./utils";

const defaults = {
    dpi: 96,
    paperSize: {
        width: 210,
        height: 297
    },
    margin: {
        left: 10,
        top: 10,
        right: 10,
        bottom: 10
    }
};

export class Printer {
    private _serverConnector: any;
    private _map: any;

    constructor(map, connector) {
        this._serverConnector = connector;
        this._map = map;
    }

    getTemplates() {
        return this._serverConnector.initializationPromise.then(() => ajaxp({
            url: this._serverConnector.url + 'export/templates/' + (this._serverConnector.sessionId ? '?_sb=' + this._serverConnector.sessionId : ''),
            cache: false
        })).then(([data]) => parseJSON(data));
    }

    getPreview(properties) {
        return this.__store(properties)
            .then(() => {
                return this._serverConnector.url + 'export/preview/?noHeader=true&f=binary' + this._serverConnector.sessionSuffix + '&ts=' + Date.now();
            });
    }

    getImage(properties) {
        return this.__store(properties)
            .then(() => {
                let link = this._serverConnector.url + 'export/print/?noHeader=true&f=' + (properties.useApi ? 'json' : 'binary') + this._serverConnector.sessionSuffix + '&ts=' + Date.now() + (properties.useApi ? '&asLink=true' : '');
                if (properties.useApi) {
                    return ajaxp({url: link}).then(([id]) => id);
                } else {
                    return link;
                }
            });
    }

    __store(properties) {
        var description = <any>{
            ServiceStateDefinition: [],
            MapCenter: {
                X: properties.position ? properties.position.x : this._map.centerPoint.x,
                Y: properties.position ? properties.position.y : this._map.centerPoint.y
            },
            SpatialReference: this._map.crs.toString(),
            Dpi: properties.dpi || defaults.dpi,
            Resolution: properties.resolution || this._map.resolution,
            PaperSize: {
                Width: properties.paperSize && properties.paperSize.width || defaults.paperSize.width,
                Height: properties.paperSize && properties.paperSize.height || defaults.paperSize.height
            },
            Margin: {
                Left: properties.margin && properties.margin.left || defaults.margin.left,
                Top: properties.margin && properties.margin.top || defaults.margin.top,
                Right: properties.margin && properties.margin.right || defaults.margin.right,
                Bottom: properties.margin && properties.margin.bottom || defaults.margin.bottom
            },
            PrintingTemplateName: properties.template.Name,
            Parameters: []
        };

        for (var i = 0, len = properties.template.BindingGroups.length; i < len; i++) {
            description.Parameters = description.Parameters.concat(properties.template.BindingGroups[i].Parameters);
        }

        var services = properties.services;
        for (var i = 0, len = services.length; i < len; i++) {
            let service = services[i];
            description.ServiceStateDefinition.push({
                UniqueName: service.name || service.id,
                Opactiy: service.layer.opacity,
                IsVisible: service.isDisplayed,
                Title: service.name,
                CustomParameters: {},
                Layers: [{ LayerId: -1, LegendItemId: -1, Children: [] }]
            });
        }

        description.Legend = {
            LayerId: -1,
            LegendItemId: -1,
            Children: services.filter(x => x.hasLegend).map(x => {
                return {
                    Name: x.alias || x.name,
                    ServiceFullName: x.name
                };
            })
        };

        return ajaxp({
            url: this._serverConnector.url + 'export/store/' + (this._serverConnector.sessionId ? '?_sb=' + this._serverConnector.sessionId : ''),
            type: 'POST',
            data: 'exportDefinition=' + encodeURIComponent(JSON.stringify(description)) + '&f=json',
            cache: false
        });
    }
}
