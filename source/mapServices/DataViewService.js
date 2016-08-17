sGis.module('spatialProcessor.mapService.DataViewService', [
    'spatialProcessor.MapService'
], (MapService) => {

    'use strict';

    class DataViewService extends MapService {
        constructor(connector, name, serviceInfo) {
            super(connector, name, serviceInfo);
            this._setLayer();
        }

        _setLayer() {
            this._layer = new sGis.ESRIDynamicLayer(this.url, { additionalParameters: '_sb=' + this.connector.sessionId, crs: this.crs, isDisplayed: this.isDisplayed });
        }

        get dataSource() {
            return this._serviceInfo.dataSourceServiceName;
        }
    }

    MapService.register('DataViewService', DataViewService);

    return DataViewService;

});