import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import SampleManager from "../../SampleManager";
import {isUncalled} from 'shared/lib/MutationUtils';
import _ from 'lodash';
import { ClinicalDataBySampleId } from 'shared/api/api-types-extended';
import { noGenePanelUsed } from "shared/lib/StoreUtils";
import SampleInline from 'pages/patientView/patientHeader/SampleInline';
import SampleLabelNotProfiled from 'shared/components/sampleLabel/SampleLabelNotProfiled';

export default class TumorColumnFormatter {
    

    public static renderFunction<T extends {sampleId:string,
                                            entrezGeneId:number}>(
                                            mutations:T[],
                                            sampleManager:SampleManager|null,
                                            sampleToGenePanelId:{[sampleId: string]: string|undefined},
                                            genePanelIdToGene:{[genePanelId: string]: number[]}) {
        
        if (!sampleManager) {
            return (<span></span>);
        }
        
        // Rules for icon:
        // - when sample->gene has mutation (present in _mutatedSamples_) show the `sample` icon 
        // - when sample->gene has no mutation (absent from _mutatedSamples_) and was profiled, show `no mutation` icon
        // - when sample->gene has no mutation (absent from _mutatedSamples_) and was not profiled, show `not profiled` icon
        const samples =  sampleManager.samples;
        const entrezGeneId = mutations[0].entrezGeneId;
        const mutatedSamples = TumorColumnFormatter.getPresentSamples(mutations);
        const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(entrezGeneId, samples, sampleToGenePanelId, genePanelIdToGene);

        const tdValue = samples.map((sample:any) => {
                // hide labels for non-existent mutation data
                // decreased opacity for uncalled mutations
                // show not-profiled icon when gene was not analyzed
                const isMutated = sample.id in mutatedSamples;
                const isProfiled = sample.id in profiledSamples && profiledSamples[sample.id];
                
                return (
                    <li className={isProfiled && !isMutated? 'invisible' : ''}>
                        {isProfiled?
                            sampleManager.getComponentForSample( 
                                sample.id,
                                (mutatedSamples[sample.id]) ? 1 : 0.1,
                                (mutatedSamples[sample.id]) ? '' : "Mutation has supporting reads, but wasn't called"
                            )
                            :
                            <SampleInline
                                sample={sample}
                                extraTooltipText={'This gene was not profiled for this sample (absent from gene panel). It is unknown whether it is mutated.'} >
                                <SampleLabelNotProfiled sample={sample}/>
                            </SampleInline>
                        }
                    </li>
                );
        });

        return (
                <div style={{position:'relative'}} data-test="samples-cell">
                    <ul  style={{marginBottom:0}} className="list-inline list-unstyled">{ tdValue }</ul>
                </div>
        );
    };

    public static getSortValue<T extends {sampleId:string}>(d:T[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return [];
        } else {
            const presentSamples = TumorColumnFormatter.getPresentSamples(d);
            const ret = [];
            // First, we sort by the number of present and called samples
            ret.push(Object.keys(presentSamples).filter((s) => presentSamples[s]).length);
            // Then, we sort by the particular ones present
            for (const sampleId of sampleManager.getSampleIdsInOrder()) {
                ret.push(+(!!presentSamples[sampleId]));
            }
            return ret;
        }
    }

    public static getPresentSamples<T extends {sampleId:string, tumorAltCount?: number, molecularProfileId?: string}>(data:T[]) {
        return data.reduce((map, next:T, currentIndex:number) => {
            // Indicate called mutations with true,
            // uncalled mutations with supporting reads as false
            // exclude uncalled mutations without supporting reads completely
            if (next.molecularProfileId && isUncalled(next.molecularProfileId)) {
                if (next.tumorAltCount && next.tumorAltCount > 0) {
                    map[next.sampleId] = false;
                }
            } else {
                map[next.sampleId] = true;
            }
            return map;
        }, {} as {[s:string]:boolean});
    }

    public static getProfiledSamplesForGene(entrezGeneId:number, samples:ClinicalDataBySampleId[], sampleToGenePanelId:{[sampleId: string]: string|undefined}, genePanelIdToEntrezGeneIds:{[genePanelId: string]: number[]}) {
        // For a given gene indicate whether it was profiled in a particular sample
        return samples.reduce((map, nextSample, currentIndex:number) => {
            const genePanelId = sampleToGenePanelId[nextSample.id];
            
            const wholeGenome = noGenePanelUsed(genePanelId);
            const isInGenePanel = !wholeGenome && genePanelId && genePanelId in genePanelIdToEntrezGeneIds && genePanelIdToEntrezGeneIds[genePanelId].includes(entrezGeneId);

            if (wholeGenome || isInGenePanel) {
                map[nextSample.id] = true;
            } else {
                map[nextSample.id] = false;
            }
            return map;
        }, {} as {[s:string]:boolean});
    }

    public static getSample(data:Array<{sampleId:string}>): string|string[] {
        let result: string[] =[];
        if (data) {
            data.forEach((datum:{sampleId:string}) => {
                result.push(datum.sampleId);
            })
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }
}
